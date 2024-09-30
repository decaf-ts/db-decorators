import { DBKeys, DefaultSeparator } from "./constants";
import { OrderDirection } from "../validation/constants";
import { apply, metadata } from "@decaf-ts/reflection";
import { IndexMetadata } from "../repository/types";
import { Hashing, Model, sf } from "@decaf-ts/decorator-validation";
import { DBModel } from "./DBModel";
import { onCreateUpdate } from "../operations/decorators";
import { IRepository } from "../interfaces/IRepository";
import { InternalError } from "../repository/errors";

/**
 *
 * @param {str} str
 * @memberOf db-decorators.model
 */

export function getDBKey(str: string) {
  return DBKeys.REFLECT + str;
}

/**
 * @summary Index Decorator
 * @description properties decorated will the index in the
 * DB for performance in queries
 *
 * @param {OrderDirection[]} [directions]
 * @param {string[]} [compositions]
 *
 * @function index
 */
export function index(compositions?: string[], directions?: OrderDirection[]) {
  return metadata(
    getDBKey(
      `${DBKeys.INDEX}${compositions && compositions.length ? `.${compositions.join(".")}` : ""}`,
    ),
    {
      directions: directions,
      compositions: compositions,
    } as IndexMetadata,
  );
}

export function hashOnCreateUpdate<
  T extends DBModel,
  V extends IRepository<T>,
  Y = any,
>(this: V, data: Y, key: string, model: T, oldModel?: T): void {
  if (!(model as any)[key]) return;
  const hash = Hashing.hash((model as any)[key]);
  if (oldModel && (model as any)[key] === hash) return;
  (model as any)[key] = hash;
}

export function hash() {
  return apply(
    onCreateUpdate(hashOnCreateUpdate),
    metadata(getDBKey(DBKeys.HASH), {}),
  );
}

export function composedFromCreateUpdate(
  args: string[],
  separator: string = DefaultSeparator,
  type: "keys" | "values" = "values",
  prefix = "",
  suffix = "",
) {
  return function composedFromCreateUpdate<
    T extends DBModel,
    V extends IRepository<T>,
  >(this: V, key: string, model: T) {
    try {
      const composed = args.map((arg: string) => {
        if (!(arg in model))
          throw new InternalError(
            sf("Property {0} not found to compose from", arg),
          );
        if (type === "keys") return arg;
        if (typeof (model as any)[arg] === "undefined")
          throw new InternalError(
            sf("Property {0} does not contain a value to compose from", arg),
          );
        return ((model as any)[arg] as any).toString();
      });

      if (prefix) composed.unshift(prefix);
      if (suffix) composed.push(suffix);

      (model as any)[key] = composed.join(separator);
    } catch (e: any) {
      throw new InternalError(`Failed to compose value: ${e}`);
    }
  };
}

function composedFrom(
  args: string[],
  hashResult: boolean = false,
  separator: string = DefaultSeparator,
  type: "keys" | "values" = "values",
  prefix = "",
  suffix = "",
) {
  const data = {
    args: args,
    hashResult: hashResult,
    separator: separator,
    type: type,
    prefix: prefix,
    suffix: suffix,
  };

  const decorators = [
    onCreateUpdate(
      composedFromCreateUpdate(args, separator, type, prefix, suffix),
    ),
    metadata(getDBKey(DBKeys.COMPOSED), data),
  ];
  if (hashResult) decorators.push(hash());
  return apply(...decorators);
}

export function composedFromKeys(
  args: string[],
  hash: boolean = false,
  prefix = "",
  suffix = "",
) {
  return composedFrom(args, hash, DefaultSeparator, "keys", prefix, suffix);
}

export function composed(
  args: string[],
  hash: boolean = false,
  prefix = "",
  suffix = "",
) {
  return composedFrom(args, hash, DefaultSeparator, "values", prefix, suffix);
}
