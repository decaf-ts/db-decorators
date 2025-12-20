import type { ModelArg } from "@decaf-ts/decorator-validation";
import { Model, model, required } from "@decaf-ts/decorator-validation";
import { timestamp } from "../../src/validation/decorators";
import { RamRepository } from "./RamRepository";
import { id, OperationKeys } from "../../src";

class BaseTestModel extends Model {
  @timestamp([OperationKeys.CREATE])
  createdAt!: Date;

  constructor(arg?: ModelArg<BaseTestModel>) {
    super(arg);
  }
}

class OtherBaseTestModel extends BaseTestModel {
  @timestamp()
  updatedAt!: Date;

  constructor(arg?: ModelArg<OtherBaseTestModel>) {
    super(arg);
  }
}

@model()
class LastBaseModel extends OtherBaseTestModel {
  @id()
  id!: string;
  @required()
  name!: string;

  constructor(arg?: ModelArg<LastBaseModel>) {
    super(arg);
  }
}

export class TestModelRepository extends RamRepository<LastBaseModel> {
  constructor() {
    super(LastBaseModel);
  }
}

describe(`DB extended Model`, function () {
  it(`Instantiates`, function () {
    const testModel = new LastBaseModel();
    expect(testModel).not.toBeNull();
  });

  it(`Fails Empty Validation`, function () {
    const testModel = new LastBaseModel({});
    expect(testModel).not.toBeNull();
    const errors = testModel.hasErrors();
    expect(errors).not.toBeNull();
    if (errors) {
      expect(new Set(Object.keys(errors)).size).toBe(4); // how many properties have errors
      expect(Object.values(errors).length).toBe(4); // how many total errors
    }
  });

  it(`Fails timestamp date validation`, function () {
    const testModel = new LastBaseModel({
      id: "id",
      name: "name",
    });

    expect(testModel).not.toBeNull();

    // @ts-expect-error illegal override for test
    testModel.updatedat = "test";
    // @ts-expect-error illegal override for test
    testModel.createdAt = "test";

    const errors = testModel.hasErrors();
    expect(errors).not.toBeNull();
    if (errors) {
      expect(new Set(Object.keys(errors)).size).toBe(2); // how many properties have errors
      expect(Object.values(errors).length).toBe(2); // how many total errors
    }
  });

  it("properly generates through all inheritance levels", async () => {
    const repo = new TestModelRepository();

    const toCreate = new LastBaseModel({
      id: "id",
      name: "name",
    });
    const created = await repo.create(toCreate);

    expect(created).toBeDefined();
    expect(created.hasErrors()).toBeUndefined();
  });
});
