import {
  getAllPropertyDecoratorsRecursive,
  Repository,
  SerializationError,
} from "../repository";
import { Model } from "@decaf-ts/decorator-validation";
import { DBKeys } from "./constants";

export function isTransient<M extends Model>(model: M) {
  return !!(
    Reflect.getMetadata(Repository.key(DBKeys.TRANSIENT), model.constructor) ||
    Reflect.getMetadata(
      Repository.key(DBKeys.TRANSIENT),
      Model.get(model.constructor.name) as any
    )
  );
}

export function modelToTransient<M extends Model>(
  model: M
): { model: M; transient?: Record<string, any> } {
  if (!isTransient(model)) return { model: model };
  const decs: Record<string, any[]> = getAllPropertyDecoratorsRecursive(
    model,
    undefined,
    Repository.key(DBKeys.TRANSIENT)
  ) as Record<string, any[]>;

  const result = Object.entries(decs).reduce(
    (
      accum: { model: Record<string, any>; transient?: Record<string, any> },
      [k, val]
    ) => {
      const transient = val.find((el) => el.key === "");
      if (transient) {
        accum.transient = accum.transient || {};
        try {
          accum.transient[k] = JSON.stringify(
            (model as Record<string, any>)[k]
          );
        } catch (e: unknown) {
          throw new SerializationError(
            `Failed to serialize transient property ${k}: ${e}`
          );
        }
      } else {
        accum.model = accum.model || {};
        accum.model[k] = (model as Record<string, any>)[k];
      }
      return accum;
    },
    {} as { model: Record<string, any>; transient?: Record<string, any> }
  );
  result.model = Model.build(result.model, model.constructor.name);
  return result as { model: M; transient?: Record<string, any> };
}
