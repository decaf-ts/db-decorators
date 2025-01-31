import { DBKeys, DefaultSeparator } from "./constants";
import { apply } from "@decaf-ts/reflection";
import {
  Hashing,
  Model,
  propMetadata,
  sf,
} from "@decaf-ts/decorator-validation";
import { onCreateUpdate } from "../operations/decorators";
import { IRepository } from "../interfaces/IRepository";
import { InternalError } from "../repository/errors";
import { Repository } from "../repository/Repository";
import { Context } from "../repository/Context";

/**
 *
 * @param {str} str
 * @memberOf db-decorators.model
 */

export function hashOnCreateUpdate<
  M extends Model,
  R extends IRepository<M>,
  Y = any,
>(this: R, data: Y, key: string, model: M, oldModel?: M): void {
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
  V extends IRepository<M>,
>(
  this: V,
  context: Context<M>,
  data: ComposedFromMetadata,
  key: string,
  model: M
) {
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
