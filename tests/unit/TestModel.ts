import {
  async,
  AsyncValidator,
  minlength,
  Model,
  ModelArg,
  prop,
  propMetadata,
  required,
  Validation,
  ValidationMetadata,
  validator,
  ValidatorOptions,
} from "@decaf-ts/decorator-validation";
import { DBOperations, id, readonly, timestamp } from "../../src";

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

export const PROMISE_VALIDATION_KEY = "async-validator-key";
export const PROMISE_ERROR_MESSAGE = "Async validation fail";
export const CUSTOM_VALIDATION_ERROR_MESSAGE = "Invalid value";

export interface PromiseValidatorOptions extends ValidatorOptions {
  timeout?: number;
}

@validator(PROMISE_VALIDATION_KEY)
export class PromiseValidator extends AsyncValidator<PromiseValidatorOptions> {
  constructor(message: string = PROMISE_ERROR_MESSAGE) {
    super(message);
  }

  async hasErrors(
    value: number,
    options?: PromiseValidatorOptions
  ): Promise<string | undefined> {
    const delay = options?.timeout ?? 100;
    if (value > delay) {
      return CUSTOM_VALIDATION_ERROR_MESSAGE;
    }

    await new Promise((res) => setTimeout(res, delay));
    return undefined;
  }
}

export const testAsync = (message: string = PROMISE_ERROR_MESSAGE) => {
  return propMetadata<ValidationMetadata>(
    Validation.key(PROMISE_VALIDATION_KEY),
    {
      message: message,
      types: ["number"],
      async: true,
    }
  );
};

export class AddressModel extends Model {
  @minlength(5)
  street?: string;

  @required()
  country?: string;

  public constructor(addressModel?: ModelArg<AddressModel>) {
    super();
    Model.fromObject(this, addressModel);
  }
}

@async()
export class UserModel extends Model {
  @id()
  id!: string | number;

  @readonly()
  name?: string;

  @testAsync()
  documentId: number;

  @prop()
  address?: AddressModel;

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
