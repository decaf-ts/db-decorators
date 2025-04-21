import { minlength, Model, ModelArg } from "@decaf-ts/decorator-validation";
import { readonly, timestamp } from "../../src/validation/decorators";
import { DBOperations } from "../../src/operations/constants";
import { id } from "../../src/identity/decorators";

export class TestModel extends Model {
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
  public constructor(testModel?: ModelArg<InheritanceTestModel>) {
    super(testModel);
    Model.fromObject(this, testModel);
  }
}
