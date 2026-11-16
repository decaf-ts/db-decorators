import { it } from "@decaf-ts/for-testing";
import {
  model,
  Model,
  ModelArg,
  required,
} from "@decaf-ts/decorator-validation";
import {
  ContextOfRepository,
  DBKeys,
  id,
  IRepository,
  on,
  OperationKeys,
  timestamp,
} from "../../src/index";
import { RamRepository } from "./RamRepository";
import { Decoration, uses } from "@decaf-ts/decoration";

const OVERRIDDEN_TS = 0;

describe("Operation flavours", () => {
  async function otherHandler<
    M extends Model,
    R extends IRepository<M, any>,
    V,
  >(
    this: R,
    context: ContextOfRepository<R>,
    data: V,
    key: keyof M,
    model: M
  ): Promise<void> {
    // A value of the property's type (validation type-checks every property),
    // distinct from what the default `@timestamp` handler would set.
    (model as any)[key] = new Date(OVERRIDDEN_TS);
  }

  Decoration.flavouredAs("other")
    .for(DBKeys.TIMESTAMP)
    .define({
      decorator: (opKeys: OperationKeys[]) => {
        return on(opKeys, otherHandler);
      },
    } as any)
    .apply();

  @model()
  class TestFlavour1 extends Model {
    @id()
    id!: number;

    @required()
    name!: string;

    @timestamp([OperationKeys.CREATE])
    createdAt!: Date;

    constructor(arg?: ModelArg<TestFlavour1>) {
      super(arg);
    }
  }

  class TestFlavour1Repo extends RamRepository<TestFlavour1> {
    constructor() {
      super(TestFlavour1);
    }
  }

  it("creates", async () => {
    const repo = new TestFlavour1Repo();
    const created = await repo.create(
      new TestFlavour1({
        id: Date.now(),
        name: "test",
      })
    );

    expect(created).toBeDefined();
    expect(created.createdAt).toEqual(expect.any(Date));
  });

  it("overrides", async () => {
    @uses("other")
    @model()
    class TestFlavour2 extends Model {
      @id()
      id!: number;

      @required()
      name!: string;

      @timestamp([OperationKeys.CREATE])
      createdAt!: Date;

      constructor(arg?: ModelArg<TestFlavour2>) {
        super(arg);
      }
    }

    class TestFlavour2Repo extends RamRepository<TestFlavour2> {
      constructor() {
        super(TestFlavour2);
      }
    }
    const repo = new TestFlavour2Repo();
    const created = await repo.create(
      new TestFlavour2({
        id: Date.now(),
        name: "test",
      })
    );

    expect(created).toBeDefined();
    expect(new Date(created.createdAt).getTime()).toEqual(OVERRIDDEN_TS);
  });
});
