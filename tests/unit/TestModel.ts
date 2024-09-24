import {constructFromObject, minlength} from "@decaf-ts/decorator-validation";
import {DBModel} from "../../src/model/DBModel";
import {readonly, timestamp} from "../../src/validation/decorators";
import {DBOperations} from "../../src/operations/constants";

export class TestModelAsync extends DBModel {

  @pk()
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

  public constructor(testModel?: TestModelAsync | {}) {
    super();
    constructFromObject(this, testModel);
  }
}


export class InheritanceTestModel extends TestModelAsync {
  public constructor(testModel?: TestModelAsync | {}) {
    super(testModel);
    constructFromObject(this, testModel);
    if (this.updatedOn)
      this.updatedOn = new Date(this.updatedOn);
    if (this.createdOn)
      this.createdOn = new Date(this.createdOn);
  }
}