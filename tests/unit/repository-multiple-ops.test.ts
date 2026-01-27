import { Injectables } from "@decaf-ts/injectable-decorators";
import { IRepository, after, onCreate, DBOperations, id } from "../../src";

import { Model, model, ModelArg } from "@decaf-ts/decorator-validation";
import { RamRepository } from "./RamRepository";

@model()
class MultipleOpsModel extends Model {
  @id()
  id!: string | number;

  @after(
    DBOperations.CREATE,
    ((context: any, data: any, prop: string, model: any) => {
      model[prop] = "";
    }) as any
  )
  @onCreate(
    ((context: any, data: any, prop: string, model: any) => {
      model[prop + "after"] = "after";
    }) as any,
    { data: 3 } as any,
    { priority: 95 }
  )
  onCreate!: string;

  constructor(arg?: ModelArg<MultipleOpsModel>) {
    super(arg);
  }
}

describe(`Repository`, function () {
  class TestRamRepository extends RamRepository<MultipleOpsModel> {
    constructor() {
      super(MultipleOpsModel);
    }
  }

  beforeEach(() => {
    Injectables.reset();
  });

  it(`Fills Properties Nicely`, async () => {
    const testRepository: IRepository<MultipleOpsModel> =
      new TestRamRepository();
    const result = await testRepository.create(
      new MultipleOpsModel({
        id: Date.now().toString(),
        onCreate: "test",
      })
    );
    expect(result.onCreateafter).toBe("after");
    expect(result.onCreate).toBe("");
  });
});
