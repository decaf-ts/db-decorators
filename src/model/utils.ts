import { SerializationError } from "../repository";
import { Model } from "@decaf-ts/decorator-validation";
import { DBKeys } from "./constants";
import { Metadata } from "@decaf-ts/decoration";
//
//
// /**
//  * @description Separates transient properties from a model
//  * @summary Extracts properties marked as transient into a separate object
//  * @template M - Type extending Model
//  * @param {M} model - The model instance to process
//  * @return {Object} Object containing the model without transient properties and a separate transient object
//  * @property {M} model - The model with transient properties removed
//  * @property {Record<string, any>} [transient] - Object containing the transient properties
//  * @function modelToTransient
//  * @memberOf module:db-decorators
//  * @mermaid
//  * sequenceDiagram
//  *   participant Caller
//  *   participant modelToTransient
//  *   participant isTransient
//  *   participant Metadata.validatableProperties
//  *
//  *   Caller->>modelToTransient: model
//  *   modelToTransient->>isTransient: check if model is transient
//  *   isTransient-->>modelToTransient: transient status
//  *   alt model is not transient
//  *     modelToTransient-->>Caller: {model}
//  *   else model is transient
//  *     modelToTransient->>Metadata.validatableProperties: get decorated properties, combine with model props
//  *     modelToTransient->>get transient properties from Metadata
//  *     modelToTransient->>modelToTransient: separate properties
//  *     modelToTransient->>Model.build: rebuild model without transient props
//  *     modelToTransient-->>Caller: {model, transient}
//  *   end
//  */
// export function modelToTransient<M extends Model>(
//   model: M
// ): { model: M; transient?: Record<string, any> } {
//   if (!isTransient(model)) return { model: model };
//   const decoratedProperties = Metadata.validatableProperties(
//     model.constructor as any
//   );
//
//   const transientProps = Metadata.get(
//     model.constructor as any,
//     DBKeys.TRANSIENT
//   );
//
//   const result = {
//     model: {} as Record<string, any>,
//     transient: {} as Record<string, any>,
//   };
//   for (const key of decoratedProperties) {
//     const isTransient = Object.keys(transientProps).includes(key);
//     if (isTransient) {
//       result.transient = result.transient || {};
//       try {
//         result.transient[key] = model[key as keyof M];
//       } catch (e: unknown) {
//         throw new SerializationError(
//           `Failed to serialize transient property ${key}: ${e}`
//         );
//       }
//     } else {
//       result.model = result.model || {};
//       result.model[key] = (model as Record<string, any>)[key];
//     }
//   }
//
//   result.model = Model.build(result.model, model.constructor.name);
//   return result as { model: M; transient?: Record<string, any> };
// }
