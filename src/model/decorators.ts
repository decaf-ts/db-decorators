import { DBKeys, DefaultSeparator } from "./constants";
import { apply, metadata } from "@decaf-ts/reflection";
import { Hashing, propMetadata, sf } from "@decaf-ts/decorator-validation";
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
    propMetadata(getDBKey(DBKeys.HASH), {})
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
  T extends DBModel,
  V extends IRepository<T>,
>(this: V, data: ComposedFromMetadata, key: string, model: T) {
  try {
    const { args, type, prefix, suffix, separator } = data;
    const composed = args.map((arg: string) => {
      if (!(arg in model))
        throw new InternalError(
          sf("Property {0} not found to compose from", arg)
        );
      if (type === "keys") return arg;
      if (typeof (model as any)[arg] === "undefined")
        throw new InternalError(
          sf("Property {0} does not contain a value to compose from", arg)
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
    propMetadata(getDBKey(DBKeys.COMPOSED), data),
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
