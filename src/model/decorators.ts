import { DBKeys, DefaultSeparator } from "./constants";
import { Hashing, Model, type } from "@decaf-ts/decorator-validation";
import { onCreate, onCreateUpdate, onUpdate } from "../operations/decorators";
import { IRepository } from "../interfaces/IRepository";
import { InternalError, ValidationError } from "../repository/errors";
import { CrudOperations, GroupSort, OperationKeys } from "../operations";
import {
  Decoration,
  propMetadata,
  apply,
  Metadata,
  metadata,
} from "@decaf-ts/decoration";
import { ContextOfRepository } from "../repository/index";

export function generated(type?: string) {
  return function generated(target: object, prop?: any) {
    return propMetadata(Metadata.key(DBKeys.GENERATED, prop), type || true)(
      target,
      prop
    );
  };
}

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
  R extends IRepository<M, any>,
  V extends object,
>(
  this: R,
  context: ContextOfRepository<R>,
  data: V,
  key: keyof M,
  model: M,
  oldModel?: M
): void {
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
    propMetadata(DBKeys.HASH, {})
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
  filterEmpty: boolean | string[];
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
  R extends IRepository<M, any>,
  V extends ComposedFromMetadata,
>(this: R, context: ContextOfRepository<R>, data: V, key: keyof M, model: M) {
  try {
    const { args, type, prefix, suffix, separator, filterEmpty, hashResult } =
      data;
    const composed = args
      .map((arg: string) => {
        if (!(arg in model))
          throw new InternalError(`Property ${arg} not found to compose from`);
        if (type === "keys") return arg;
        if (typeof (model as any)[arg] === "undefined") {
          if (filterEmpty) {
            if (!Array.isArray(filterEmpty)) return undefined;
            if (filterEmpty.includes(arg)) return undefined;
          }
          throw new InternalError(
            `Property ${args} does not contain a value to compose from`
          );
        }
        return ((model as any)[arg] as any).toString();
      })
      .filter((a) => (filterEmpty ? !!a : true));

    if (prefix) composed.unshift(prefix);
    if (suffix) composed.push(suffix);

    const str: string = composed
      .map((c: any) => {
        return typeof c === "object" && c.toString() === "[object Object]"
          ? JSON.stringify(c)
          : c;
      })
      .join(separator);

    (model as any)[key] = hashResult ? Hashing.hash(str) : str;
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
  filterEmpty: boolean | string[] = false,
  type: "keys" | "values" = "values",
  prefix = "",
  suffix = "",
  groupsort: GroupSort = { priority: 55 }
) {
  function composedFrom(
    args: string[],
    hashResult: boolean,
    separator: string,
    type: "keys" | "values",
    prefix: string,
    suffix: string,
    groupsort: GroupSort
  ) {
    return function composeFrom(target: object, property?: any) {
      const data: ComposedFromMetadata = {
        args: args,
        hashResult: hashResult,
        separator: separator,
        type: type,
        prefix: prefix,
        suffix: suffix,
        filterEmpty: filterEmpty,
      };

      const decorators = [
        generated(DBKeys.COMPOSED),
        onCreateUpdate(composedFromCreateUpdate, data, groupsort),
        propMetadata(Metadata.key(DBKeys.COMPOSED, property), data),
      ];
      if (hashResult) decorators.push(hash());
      return apply(...decorators)(target, property);
    };
  }

  return Decoration.for(DBKeys.COMPOSED)
    .define({
      decorator: composedFrom,
      args: [args, hashResult, separator, type, prefix, suffix, groupsort],
    })
    .apply();
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
  filterEmpty: boolean | string[] = false,
  hash: boolean = false,
  prefix = "",
  suffix = "",
  groupsort: GroupSort = { priority: 55 }
) {
  return composedFrom(
    args,
    hash,
    separator,
    filterEmpty,
    "keys",
    prefix,
    suffix,
    groupsort
  );
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
  filterEmpty: boolean | string[] = false,
  hash: boolean = false,
  prefix = "",
  suffix = "",
  groupsort: GroupSort = { priority: 55 }
) {
  return composedFrom(
    args,
    hash,
    separator,
    filterEmpty,
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
    R extends IRepository<M>,
    V extends object,
  >(
    this: R,
    context: ContextOfRepository<R>,
    data: V,
    key: keyof M,
    model: M,
    oldModel?: M
  ) {
    if (!Model.shouldGenerate(model, key, context)) return;
    try {
      switch (operation) {
        case OperationKeys.CREATE:
          (model as any)[key] = 1;
          break;
        case OperationKeys.UPDATE:
          if (
            context.get("applyUpdateValidation") &&
            oldModel &&
            model[key] !== oldModel[key]
          )
            throw new ValidationError(
              `Version mismatch: ${model[key]} !== ${oldModel[key]}`
            );
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
  const key = DBKeys.VERSION;
  return Decoration.for(key)
    .define(
      generated(DBKeys.VERSION),
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
  return Decoration.for(DBKeys.TRANSIENT)
    .define(function transient(model: any, attribute: any) {
      metadata(DBKeys.TRANSIENT, true)(model.constructor);
      propMetadata(Metadata.key(DBKeys.TRANSIENT, attribute), {})(
        model,
        attribute
      );
    })
    .apply();
}
