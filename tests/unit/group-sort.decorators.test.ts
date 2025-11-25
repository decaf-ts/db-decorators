import { model, Model, required } from "@decaf-ts/decorator-validation";
import type { ModelArg } from "@decaf-ts/decorator-validation";
import { RamRepository } from "./RamRepository";
import { ContextOfRepository } from "../../src/repository/types";
import { IRepository } from "../../src/interfaces/IRepository";
import { id } from "../../src/identity/decorators";
import { on } from "../../src/operations/decorators";
import { DBOperations } from "../../src/operations/constants";
import { NotFoundError } from "../../src/repository/errors";

export const globals = {
  counter: 0,
};

const METADATA = "__metadata";

function saveGroupSort<
  M extends Model,
  R extends IRepository<M, any>,
  V = object,
>(
  this: R,
  context: ContextOfRepository<R>,
  metadata: V[],
  keys: (keyof M)[],
  model: M
) {
  keys.forEach((k, i) => {
    const newMetadata = {
      ["priority_" + (k as string)]: globals.counter,
      // @ts-expect-error becaseu
      ["group_" + (k as string)]: metadata[i].igroup,
    };
    globals.counter++;
    model[METADATA] = {
      ...model[METADATA],
      ...newMetadata,
    };
  });
}

@model()
class NewTestModel extends Model {
  [key: string]: any;

  @id()
  id!: string;

  @on(
    DBOperations.CREATE,
    saveGroupSort,
    { igroup: "B", ipriority: 20, igroupPriority: 30 },
    { group: "B", priority: 20, groupPriority: 30 }
  )
  name!: string;

  @on(
    DBOperations.CREATE,
    saveGroupSort,
    { igroup: "A", ipriority: 10, igroupPriority: 20 },
    { group: "A", priority: 10, groupPriority: 20 }
  )
  nif!: string;

  @on(
    DBOperations.CREATE,
    saveGroupSort,
    { igroup: "A", ipriority: 10, igroupPriority: 10 },
    { group: "A", priority: 10, groupPriority: 10 }
  )
  email!: string;

  @required()
  @on(
    DBOperations.CREATE,
    saveGroupSort,
    { igroup: "B", ipriority: 20, igroupPriority: 5 },
    { group: "B", priority: 20, groupPriority: 5 }
  )
  address!: string;

  constructor(tm?: ModelArg<NewTestModel>) {
    super();
    Model.fromObject(this, tm);
  }
}

/**
 * This is the order of the decorators execution because:
 * - email and nif have a higher priority as a group ( priority:10 )
 * - email (groupPriority:10) have a higher priority than nif (groupPriority:20)
 * - address and name have a lower priority as a group ( priority:20 )
 * - address (groupPriority:5) have a higher priority than name (groupPriority:30)
 */
const priorityA = ["email", "nif", "address", "name"];

class TestModelOnRepo extends RamRepository<NewTestModel> {
  constructor() {
    super(NewTestModel);
  }
}

describe("Adapter", () => {
  let repo: TestModelOnRepo;

  beforeAll(async () => {
    repo = new TestModelOnRepo();
  });

  let created: NewTestModel, updated: NewTestModel;

  it("creates", async () => {
    const model = new NewTestModel({
      id: Date.now().toString(),
      name: "test_name",
      nif: "123456789",
      email: "test_email@example.com",
      address: "test_address",
    });

    created = await repo.create(model);

    // const pk = Model.pk(created, true);
    // console.log("pk:", pk);

    expect(created).toBeDefined();

    //check correct order of the decorator execution
    const metadata = created[METADATA];
    expect(metadata).toBeDefined();

    priorityA.forEach((val, i) => {
      expect(metadata["priority_" + val]).toEqual(i);
    });
  });

  it("reads", async () => {
    const read = await repo.read(created.id);

    expect(read).toBeDefined();
    expect(read.equals(created)).toEqual(true); // same model

    const metadata = created[METADATA];
    expect(metadata).toBeDefined();

    priorityA.forEach((val, i) => {
      expect(metadata["priority_" + val]).toEqual(i);
    });
  });

  it("updates", async () => {
    const toUpdate = new NewTestModel(
      Object.assign({}, created, {
        name: "new_test_name",
      })
    );

    updated = await repo.update(toUpdate);

    expect(updated).toBeDefined();
    expect(updated.equals(created)).toEqual(false);
    expect(updated.equals(created, METADATA, "name")).toEqual(true); // minus the expected changes
  });

  it("deletes", async () => {
    const deleted = await repo.delete(created.id);
    expect(deleted).toBeDefined();
    expect(deleted.equals(updated)).toEqual(true);

    await expect(repo.read(created.id)).rejects.toThrow(NotFoundError);
  });
});
