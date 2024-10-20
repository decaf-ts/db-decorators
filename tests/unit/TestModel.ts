import { minlength, Model, ModelArg } from "@decaf-ts/decorator-validation";
import { DBModel } from "../../src/model/DBModel";
import { readonly, timestamp } from "../../src/validation/decorators";
import { DBOperations } from "../../src/operations/constants";
import { id } from "../../src/identity/decorators";

export class TestModel extends DBModel {
  @id()
  id!: string | number;

  @readonly()
  name?: string;

  @minlength(5)
  address?: string;

  @timestamp()
  updatedOn!: Date;

  @timestamp(DBOperations.CREATE)
  @readonly()
  createdOn!: Date;

  public constructor(testModel?: ModelArg<TestModel>) {
    super();
    Model.fromObject(this, testModel);
  }
}

export class InheritanceTestModel extends TestModel {
  public constructor(testModel?: TestModel | {}) {
    super(testModel);
    Model.fromObject(this, testModel);
  }
}
