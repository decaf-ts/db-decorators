import {
  Model,
  ModelArg,
  Hashing,
  model,
} from "@decaf-ts/decorator-validation";
import { id, composed, composedFromKeys, InternalError } from "../../src";
import { RamRepository } from "./RamRepository";
import { prop } from "@decaf-ts/decoration";

describe("@composed decorator", () => {
  @model()
  class ComposedModel extends Model {
    @id()
    id!: string;

    @composed(["id", "name"])
    composedValue?: string;

    @composed(["id", "name"], "-")
    withSeparator?: string;

    @composed(["id", "name"], "_", false, false, "PRE", "POST")
    withPrefixSuffix?: string;

    @composed(["id", "name"], "_", false, true)
    withHash?: string;

    @composedFromKeys(["id", "name"])
    fromKeys?: string;

    @composed(["id", "missing"], "_", true)
    filterMissing?: string;

    @composed(["id", "missing"], "_", ["missing"])
    filterMissing2?: string;

    @prop()
    name?: string;
    @prop()
    missing?: string;

    constructor(arg?: ModelArg<ComposedModel>) {
      super(arg);
    }
  }

  let repo: RamRepository<ComposedModel>;

  beforeEach(() => {
    repo = new RamRepository(ComposedModel);
  });

  it("should compose values during creation", async () => {
    const model = new ComposedModel({ id: "1", name: "test" });
    const created = await repo.create(model);

    expect(created.composedValue).toBe("1_test");
    expect(created.withSeparator).toBe("1-test");
    expect(created.withPrefixSuffix).toBe("PRE_1_test_POST");
    expect(created.fromKeys).toBe("id_name");

    expect(Model.generated(ComposedModel, "composedValue")).toBe(true);
  });

  it("should hash the composed result when requested", async () => {
    const model = new ComposedModel({ id: "1", name: "test" });
    const created = await repo.create(model);

    const expectedHash = Hashing.hash("1_test");
    expect(created.withHash).toBe(expectedHash);
  });

  it("should handle missing properties with filterEmpty", async () => {
    const model = new ComposedModel({ id: "1", name: "test" });
    // 'missing' is undefined. filterEmpty=true should skip it.
    const created = await repo.create(model);

    expect(created.filterMissing).toBe("1");
    expect(created.filterMissing2).toBe("1");
  });

  it("should throw error if property is missing and filterEmpty is false", async () => {
    class StrictModel extends Model {
      @id()
      id!: string;
      @composed(["id", "none"], "_", false)
      strict?: string;
      none?: string;
      constructor(arg?: ModelArg<StrictModel>) {
        super(arg);
      }
    }
    const strictRepo = new RamRepository(StrictModel);
    const model = new StrictModel({ id: "1" });

    await expect(strictRepo.create(model)).rejects.toThrow(InternalError);
  });

  it("should update composed values when source properties change", async () => {
    const model = new ComposedModel({ id: "1", name: "initial" });
    await repo.create(model);

    model.name = "updated";
    const updated = await repo.update(model);

    expect(updated.composedValue).toBe("1_updated");
  });
});
