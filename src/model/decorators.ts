import { DBKeys, DefaultSeparator } from "./constants";
import { apply } from "@decaf-ts/reflection";
import {
  Decoration,
  Hashing,
  Model,
  propMetadata,
  type,
} from "@decaf-ts/decorator-validation";
import { onCreate, onCreateUpdate, onUpdate } from "../operations/decorators";
import { IRepository } from "../interfaces/IRepository";
import { InternalError } from "../repository/errors";
import { Repository } from "../repository/Repository";
import { Context } from "../repository/Context";
import { CrudOperations, OperationKeys } from "../operations";
import { RepositoryFlags } from "../repository";

/**
 *
 * @param {str} str
 * @memberOf db-decorators.model
 */

export function hashOnCreateUpdate<
  M extends Model,
  R extends IRepository<M, C, F>,
  V extends object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(this: R, context: C, data: V, key: keyof M, model: M, oldModel?: M): void {
  if (!(model as any)[key]) return;
  const hash = Hashing.hash((model as any)[key]);
  if (oldModel && (model as any)[key] === hash) return;
  (model as any)[key] = hash;
}

export function hash() {
  return apply(
    onCreateUpdate(hashOnCreateUpdate),
    propMetadata(Repository.key(DBKeys.HASH), {})
  );
}

export type ComposedFromMetadata = {
  args: string[];
  separator: string;
  hashResult: boolean;
  type: "keys" | "values";
  prefix?: string;
  suffix?: string;
};

export function composedFromCreateUpdate<
  M extends Model,
  R extends IRepository<M, C, F>,
  V extends ComposedFromMetadata,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(this: R, context: C, data: V, key: keyof M, model: M) {
  try {
    const { args, type, prefix, suffix, separator } = data;
    const composed = args.map((arg: string) => {
      if (!(arg in model))
        throw new InternalError(`Property ${arg} not found to compose from`);
      if (type === "keys") return arg;
      if (typeof (model as any)[arg] === "undefined")
        throw new InternalError(
          `Property ${args} does not contain a value to compose from`
        );
      return ((model as any)[arg] as any).toString();
    });

    if (prefix) composed.unshift(prefix);
    if (suffix) composed.push(suffix);

    (model as any)[key] = composed.join(separator);
  } catch (e: any) {
    throw new InternalError(`Failed to compose value: ${e}`);
  }
}

function composedFrom(
  args: string[],
  hashResult: boolean = false,
  separator: string = DefaultSeparator,
  type: "keys" | "values" = "values",
  prefix = "",
  suffix = ""
) {
  const data: ComposedFromMetadata = {
    args: args,
    hashResult: hashResult,
    separator: separator,
    type: type,
    prefix: prefix,
    suffix: suffix,
  };

  const decorators = [
    onCreateUpdate(composedFromCreateUpdate, data),
    propMetadata(Repository.key(DBKeys.COMPOSED), data),
  ];
  if (hashResult) decorators.push(hash());
  return apply(...decorators);
}

export function composedFromKeys(
  args: string[],
  separator: string = DefaultSeparator,
  hash: boolean = false,
  prefix = "",
  suffix = ""
) {
  return composedFrom(args, hash, separator, "keys", prefix, suffix);
}

export function composed(
  args: string[],
  separator: string = DefaultSeparator,
  hash: boolean = false,
  prefix = "",
  suffix = ""
) {
  return composedFrom(args, hash, separator, "values", prefix, suffix);
}

/**
 * Creates a decorator function that updates the version of a model during create or update operations.
 *
 * @param {CrudOperations} operation - The type of operation being performed (CREATE or UPDATE).
 * @returns {function} A function that updates the version of the model based on the operation type.
 *
 * @template M - Type extending Model
 * @template V - Type extending IRepository<M>
 *
 * @this {V} - The repository instance
 * @param {Context<M>} context - The context of the operation
 * @param {unknown} data - Additional data for the operation (not used in this function)
 * @param {string} key - The key of the version property in the model
 * @param {M} model - The model being updated
 * @throws {InternalError} If an invalid operation is provided or if version update fails
 */
export function versionCreateUpdate(operation: CrudOperations) {
  return function versionCreateUpdate<
    M extends Model,
    R extends IRepository<M, C, F>,
    V extends object,
    F extends RepositoryFlags = RepositoryFlags,
    C extends Context<F> = Context<F>,
  >(this: R, context: C, data: V, key: keyof M, model: M) {
    try {
      switch (operation) {
        case OperationKeys.CREATE:
          (model as any)[key] = 1;
          break;
        case OperationKeys.UPDATE:
          (model as any)[key]++;
          break;
        default:
          throw new InternalError(`Invalid operation: ${operation}`);
      }
    } catch (e: unknown) {
      throw new InternalError(`Failed to update version: ${e}`);
    }
  };
}

/**
 * @description Creates a decorator for versioning a property in a model.
 * @summary This decorator applies multiple sub-decorators to handle version management during create and update operations.
 *
 * @returns {Function} A composite decorator that:
 *   - Sets the type of the property to Number
 *   - Applies a version update on create operations
 *   - Applies a version update on update operations
 *   - Adds metadata indicating this property is used for versioning
 */
export function version() {
  const key = Repository.key(DBKeys.VERSION);
  return Decoration.for(key)
    .define(
      type(Number.name),
      onCreate(versionCreateUpdate(OperationKeys.CREATE)),
      onUpdate(versionCreateUpdate(OperationKeys.UPDATE)),
      propMetadata(key, true)
    )
    .apply();
}

export function transient() {
  const key = Repository.key(DBKeys.TRANSIENT);
  function transientDec(model: any, attribute: any) {
    propMetadata(key, true)(model, attribute);
    propMetadata(key, true)(model.constructor);
  }
  return Decoration.for(key).define(transientDec).apply();
}
