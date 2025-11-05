import {
  async,
  AsyncValidator,
  min,
  minlength,
  model,
  Model,
  ModelArg,
  required,
  Validation,
  ValidationKeys,
  validator,
  ValidatorOptions,
} from "@decaf-ts/decorator-validation";
import { DBOperations, id, readonly, timestamp } from "../../src";
import { propMetadata, prop, Metadata, apply } from "@decaf-ts/decoration";

@model()
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
    super(testModel);
  }
}

export class InheritanceTestModel extends TestModel {
  public constructor(testModel?: ModelArg<InheritanceTestModel>) {
    super(testModel);
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
    await new Promise((res) => setTimeout(res, delay));
    if (value > delay) return CUSTOM_VALIDATION_ERROR_MESSAGE;
    return undefined;
  }
}

export const testAsync = (message: string = PROMISE_ERROR_MESSAGE) => {
  const options = {
    message,
    types: ["number"],
    async: true,
  };
  return apply((model: object, prop?: any) =>
    propMetadata(
      Metadata.key(ValidationKeys.REFLECT, prop, PROMISE_VALIDATION_KEY),
      options
    )(model, prop)
  );

  return propMetadata(Validation.key(PROMISE_VALIDATION_KEY), options);
};

@model()
@async()
export class AsyncModel extends Model {
  @min(200)
  @testAsync()
  value?: number;

  public constructor(model?: ModelArg<AsyncModel>) {
    super(model);
  }
}

@model()
export class AddressModel extends Model {
  @minlength(5)
  street?: string;

  @required()
  country?: string;

  public constructor(addressModel?: ModelArg<AddressModel>) {
    super(addressModel);
  }
}

@model()
@async()
export class UserModel extends Model<true> {
  @id()
  id!: string | number;

  @readonly()
  name?: string;

  @testAsync()
  documentId!: number;

  @prop()
  asyncNested?: AsyncModel;

  @prop()
  address?: AddressModel;

  @timestamp() // Intentionally left without DBOperations to test
  updatedOn!: Date;

  @timestamp(DBOperations.CREATE)
  @readonly()
  createdOn!: Date;

  public constructor(testModel?: ModelArg<TestModel>) {
    super(testModel);
  }
}
