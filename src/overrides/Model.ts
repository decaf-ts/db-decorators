import "@decaf-ts/decorator-validation";
import { Constructor } from "@decaf-ts/decoration";
import { Model as MM } from "@decaf-ts/decorator-validation";

declare module "@decaf-ts/decorator-validation" {
  export interface Model {
    isTransient(): boolean;
    toTransient<M extends MM>(
      this: M
    ): { model: M; transient?: Record<string, any> };
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Model {
    /**
     * @description Retrieves primary key information for a model
     * @summary Retrieves primary key information or it's value for a model from it's metadata.
     *
     * @template model - The model type extending from Model
     * @param {M | Constructor<M>} model - The model class or it's constructor
     * @param {boolean} keyValue - Optional keyValue flag, to return the value of the id instead of the property. Does not work with constructor.
     * @return {any} The property of the id of the model, or it's value
     *
     * @example
     * class User extends Model {
     *
     *       const idProp = Model.pk(newModel);
     *       const id = Model.pk(newModel, true);
     */
    function pk<M>(model: M | Constructor<M>, keyValue?: boolean): any;

    function isTransient<M extends Model>(model: M | Constructor<M>): boolean;
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
     *   participant Metadata.validatableProperties
     *
     *   Caller->>modelToTransient: model
     *   modelToTransient->>isTransient: check if model is transient
     *   isTransient-->>modelToTransient: transient status
     *   alt model is not transient
     *     modelToTransient-->>Caller: {model}
     *   else model is transient
     *     modelToTransient->>Metadata.validatableProperties: get decorated properties, combine with model props
     *     modelToTransient->>get transient properties from Metadata
     *     modelToTransient->>modelToTransient: separate properties
     *     modelToTransient->>Model.build: rebuild model without transient props
     *     modelToTransient-->>Caller: {model, transient}
     *   end
     */
    function toTransient<M extends Model>(
      model: M
    ): { model: M; transient?: Record<string, any> };
  }
}
