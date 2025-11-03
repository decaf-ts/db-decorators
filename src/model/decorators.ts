import { DBKeys, DefaultSeparator } from "./constants";
import { Hashing, Model, type } from "@decaf-ts/decorator-validation";
import { onCreate, onCreateUpdate, onUpdate } from "../operations/decorators";
import { IRepository } from "../interfaces/IRepository";
import { InternalError } from "../repository/errors";
import { Repository } from "../repository/Repository";
import { Context } from "../repository/Context";
import { CrudOperations, GroupSort, OperationKeys } from "../operations";
import { RepositoryFlags } from "../repository/types";
import {
  Decoration,
  propMetadata,
  apply,
  Metadata,
} from "@decaf-ts/decoration";

/**
 * @description Hashes a property value during create or update operations
 * @summary Callback function used by the hash decorator to apply hashing to a property value
 * @template M - Type extending Model
 * @template R - Type extending IRepository
 * @template V - Type for metadata
 * @template F - Type extending RepositoryFlags
 * @template C - Type extending Context
 * @param {C} context - The operation context
 * @param {V} data - Metadata for the operation
 * @param key - The property key to hash
 * @param {M} model - The model being processed
 * @param {M} [oldModel] - The previous model state (for updates)
 * @return {void}
 * @function hashOnCreateUpdate
 * @memberOf module:db-decorators
 */
export function hashOnCreateUpdate<
  M extends Model,
  R extends IRepository<M, F, C>,
  V extends object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(this: R, context: C, data: V, key: keyof M, model: M, oldModel?: M): void {
  if (typeof model[key] === "undefined") return;
  const hash = Hashing.hash((model as any)[key]);
  if (oldModel && (model as any)[key] === hash) return;
  model[key] = hash;
}

/**
 * @description Creates a decorator that hashes a property value
 * @summary Decorator that automatically hashes a property value during create and update operations
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function hash
 * @category Property Decorators
 */
export function hash() {
  return apply(
    onCreateUpdate(hashOnCreateUpdate),
    propMetadata(Repository.key(DBKeys.HASH), {})
  );
}

/**
 * @description Metadata for composed property decorators
 * @summary Configuration options for property composition from other properties
 * @typedef {Object} ComposedFromMetadata
 * @property {string[]} args - Property names to compose from
 * @property {string} separator - Character used to join the composed values
 * @property {boolean} hashResult - Whether to hash the composed result
 * @property {"keys"|"values"} type - Whether to use property keys or values
 * @property {string} [prefix] - Optional prefix to add to the composed value
 * @property {string} [suffix] - Optional suffix to add to the composed value
 * @memberOf module:db-decorators
 */
export type ComposedFromMetadata = {
  args: string[];
  separator: string;
  hashResult: boolean;
  type: "keys" | "values";
  prefix?: string;
  suffix?: string;
};

/**
 * @description Composes a property value from other properties during create or update operations
 * @summary Callback function used by composed decorators to generate a property value from other properties
 * @template M - Type extending Model
 * @template R - Type extending IRepository
 * @template V - Type extending ComposedFromMetadata
 * @template F - Type extending RepositoryFlags
 * @template C - Type extending Context
 * @param {C} context - The operation context
 * @param {V} data - Metadata for the composition
 * @param key - The property key to set the composed value on
 * @param {M} model - The model being processed
 * @return {void}
 * @function composedFromCreateUpdate
 * @memberOf module:db-decorators
 */
export function composedFromCreateUpdate<
  M extends Model,
  R extends IRepository<M, F, C>,
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

/**
 * @description Creates a decorator that composes a property value from other properties
 * @summary Base function for creating property composition decorators
 * @param {string[]} args - Property names to compose from
 * @param {boolean} [hashResult=false] - Whether to hash the composed result
 * @param {string} [separator=DefaultSeparator] - Character used to join the composed values
 * @param {"keys"|"values"} [type="values"] - Whether to use property keys or values
 * @param {string} [prefix=""] - Optional prefix to add to the composed value
 * @param {string} [suffix=""] - Optional suffix to add to the composed value
 * @param {GroupSort} groupsort - GroupSort configuration
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function composedFrom
 * @category PropertyDecorators
 */
function composedFrom(
  args: string[],
  hashResult: boolean = false,
  separator: string = DefaultSeparator,
  type: "keys" | "values" = "values",
  prefix = "",
  suffix = "",
  groupsort: GroupSort = { priority: 55 }
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
    onCreateUpdate(composedFromCreateUpdate, data, groupsort),
    propMetadata(Repository.key(DBKeys.COMPOSED), data),
  ];
  if (hashResult) decorators.push(hash());
  return apply(...decorators);
}

/**
 * @description Creates a decorator that composes a property value from property keys
 * @summary Decorator that generates a property value by joining the names of other properties
 * @param {string[]} args - Property names to compose from
 * @param {string} [separator=DefaultSeparator] - Character used to join the property names
 * @param {boolean} [hash=false] - Whether to hash the composed result
 * @param {string} [prefix=""] - Optional prefix to add to the composed value
 * @param {string} [suffix=""] - Optional suffix to add to the composed value
 * @param {GroupSort} groupsort - GroupSort configuration
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function composedFromKeys
 * @category PropertyDecorators
 */
export function composedFromKeys(
  args: string[],
  separator: string = DefaultSeparator,
  hash: boolean = false,
  prefix = "",
  suffix = "",
  groupsort: GroupSort = { priority: 55 }
) {
  return composedFrom(args, hash, separator, "keys", prefix, suffix, groupsort);
}

/**
 * @description Creates a decorator that composes a property value from property values
 * @summary Decorator that generates a property value by joining the values of other properties
 * @param {string[]} args - Property names whose values will be composed
 * @param {string} [separator=DefaultSeparator] - Character used to join the property values
 * @param {boolean} [hash=false] - Whether to hash the composed result
 * @param {string} [prefix=""] - Optional prefix to add to the composed value
 * @param {string} [suffix=""] - Optional suffix to add to the composed value
 * @param {GroupSort} groupsort - GroupSort configuration
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function composed
 * @category PropertyDecorators
 */
export function composed(
  args: string[],
  separator: string = DefaultSeparator,
  hash: boolean = false,
  prefix = "",
  suffix = "",
  groupsort: GroupSort = { priority: 55 }
) {
  return composedFrom(
    args,
    hash,
    separator,
    "values",
    prefix,
    suffix,
    groupsort
  );
}

/**
 * @description Creates a function that updates a version property during operations
 * @summary Factory function that generates a callback for incrementing version numbers
 * @param {CrudOperations} operation - The type of operation (CREATE or UPDATE)
 * @return {Function} A callback function that updates the version property
 * @template M - Type extending Model
 * @template R - Type extending IRepository
 * @template V - Type for metadata
 * @template F - Type extending RepositoryFlags
 * @template C - Type extending Context
 * @function versionCreateUpdate
 * @memberOf module:db-decorators
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant versionCreateUpdate
 *
 *   Caller->>versionCreateUpdate: operation
 *   versionCreateUpdate-->>Caller: callback function
 *   Note over Caller,versionCreateUpdate: When callback is executed:
 *   Caller->>versionCreateUpdate: context, data, key, model
 *   alt operation is CREATE
 *     versionCreateUpdate->>versionCreateUpdate: set version to 1
 *   else operation is UPDATE
 *     versionCreateUpdate->>versionCreateUpdate: increment version
 *   else invalid operation
 *     versionCreateUpdate->>versionCreateUpdate: throw error
 *   end
 *   versionCreateUpdate-->>Caller: void
 */
export function versionCreateUpdate(operation: CrudOperations) {
  return function versionCreateUpdate<
    M extends Model,
    R extends IRepository<M, F, C>,
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
 * @description Creates a decorator for versioning a property in a model
 * @summary This decorator applies multiple sub-decorators to handle version management during create and update operations
 * @return {PropertyDecorator} A composite decorator that sets the type to Number, manages version updates, and adds versioning metadata
 * @function version
 * @category PropertyDecorators
 */
export function version() {
  const key = Repository.key(DBKeys.VERSION);
  return Decoration.for(key)
    .define(
      type(Number),
      onCreate(versionCreateUpdate(OperationKeys.CREATE)),
      onUpdate(versionCreateUpdate(OperationKeys.UPDATE)),
      propMetadata(key, true)
    )
    .apply();
}

/**
 * @description Creates a decorator that marks a property as transient
 * @summary Decorator that indicates a property should not be persisted to the database
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function transient
 * @category PropertyDecorators
 */
export function transient() {
  const key = Repository.key(DBKeys.TRANSIENT);
  return Decoration.for(key)
    .define(function transient(model: any, attribute: any) {
      propMetadata(Repository.key(DBKeys.TRANSIENT), true)(model.constructor);
      propMetadata(Metadata.key(DBKeys.TRANSIENT, attribute), {})(
        model,
        attribute
      );
    })
    .apply();
}
