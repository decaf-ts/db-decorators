import {
  getAllPropertyDecoratorsRecursive,
  Repository,
  SerializationError,
} from "../repository";
import { Model } from "@decaf-ts/decorator-validation";
import { DBKeys } from "./constants";

/**
 * @description Checks if a model is marked as transient
 * @summary Determines whether a model class has been decorated with the transient decorator
 * @template M - Type extending Model
 * @param {M} model - The model instance to check
 * @return {boolean} True if the model is transient, false otherwise
 * @function isTransient
 * @memberOf module:db-decorators
 */
export function isTransient<M extends Model>(model: M) {
  return !!(
    Reflect.getMetadata(Repository.key(DBKeys.TRANSIENT), model.constructor) ||
    Reflect.getMetadata(
      Repository.key(DBKeys.TRANSIENT),
      Model.get(model.constructor.name) as any
    )
  );
}

/**
 * @description Separates transient properties from a model
 * @summary Extracts properties marked as transient into a separate object
 * @template M - Type extending Model
 * @param {M} model - The model instance to process
 * @return {Object} Object containing the model without transient properties and a separate transient object
 * @property {M} model - The model with transient properties removed
 * @property {Record<string, any>} [transient] - Object containing the transient properties
 * @function modelToTransient
 * @memberOf module:db-decorators
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant modelToTransient
 *   participant isTransient
 *   participant getAllPropertyDecoratorsRecursive
 *
 *   Caller->>modelToTransient: model
 *   modelToTransient->>isTransient: check if model is transient
 *   isTransient-->>modelToTransient: transient status
 *   alt model is not transient
 *     modelToTransient-->>Caller: {model}
 *   else model is transient
 *     modelToTransient->>getAllPropertyDecoratorsRecursive: get transient properties
 *     getAllPropertyDecoratorsRecursive-->>modelToTransient: property decorators
 *     modelToTransient->>modelToTransient: separate properties
 *     modelToTransient->>Model.build: rebuild model without transient props
 *     modelToTransient-->>Caller: {model, transient}
 *   end
 */
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
          accum.transient[k] = model[k as keyof M];
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
