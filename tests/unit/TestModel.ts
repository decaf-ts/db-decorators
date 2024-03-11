import {AsyncRepository, DBModel, DBOperations, id, IGeneratorAsync, readonly, timestamp} from "../../src";
import {constructFromObject, minlength} from "@decaf-ts/decorator-validation";
import {Callback} from "@decaf-ts/logging";

export class TimeStampGeneratorAsync<T extends DBModel> implements IGeneratorAsync<T> {
  generate(repo: AsyncRepository<T>, model: T, ...args: any[]): void {
    const callback: Callback = args.pop();
    const result = Date.now();
    callback(undefined, result);
  }
}

export class TestModelAsync extends DBModel {

  @id<TestModelAsync>(TimeStampGeneratorAsync)
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