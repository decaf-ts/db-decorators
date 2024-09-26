import {constructFromObject, minlength, ModelArg} from "@decaf-ts/decorator-validation";
import {DBModel} from "../../src/model/DBModel";
import {readonly, timestamp} from "../../src/validation/decorators";
import {DBOperations} from "../../src/operations/constants";
import {id} from "../../src/identity/decorators";

export class TestModel extends DBModel {

  @id()
  id?: string | number = undefined;

  @readonly()
  name?: string = undefined;

  @minlength(5)
  address?: string = undefined;

  @timestamp()
  updatedOn?: Date = undefined;

  @timestamp(DBOperations.CREATE)
  @readonly()
  createdOn?: Date = undefined;

  public constructor(testModel?: ModelArg<TestModel>) {
    super();
    constructFromObject(this, testModel);
  }
}


export class InheritanceTestModel extends TestModel {

  public constructor(testModel?: TestModel | {}) {
    super(testModel);
    constructFromObject(this, testModel);
  }
}