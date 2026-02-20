import { Constructor } from "@decaf-ts/decoration";
import "@decaf-ts/decorator-validation";
import { ComposedFromMetadata } from "../model/index";
import { Context } from "../repository/index";

declare module "@decaf-ts/decorator-validation" {
  export interface Model {
    isTransient(): boolean;
    segregate<M extends Model<boolean>>(
      this: M
    ): { model: M; transient?: Record<keyof M, M[keyof M]> };
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
    function pk<M extends Model<boolean>>(model: M | Constructor<M>): keyof M;
    function pk<M extends Model<boolean>>(
      model: M,
      keyValue: boolean
    ): M[keyof M];
    function pk<M extends Model<boolean>>(
      model: M | Constructor<M>,
      keyValue?: boolean
    ): keyof M | M[keyof M];

    function pkProps<M extends Model<boolean>>(model: Constructor<M>): any;

    function isTransient<M extends Model<boolean>>(
      model: M | Constructor<M>
    ): boolean;
    /**
     * @description Separates transient properties from a model
     * @summary Extracts properties marked as transient into a separate object
     * @template M - Type extending Model
     * @param {M} model - The model instance to process
     * @return {Object} Object containing the model without transient properties and a separate transient object
     * @property {M} model - The model with transient properties removed
     * @property {Record<string, any>} [transient] - Object containing the transient properties
     * @function segregate
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
    function segregate<M extends Model<boolean>>(
      model: M
    ): { model: M; transient?: Record<keyof M, M[keyof M]> };
    /**
     * @description Merges two model instances into a new instance.
     * @summary Creates a new model instance by combining properties from an old model and a new model.
     * Properties from the new model override properties from the old model if they are defined.
     * @param {M} oldModel - The original model instance
     * @param {M} model - The new model instance with updated properties
     * @return {M} A new model instance with merged properties
     */
    function merge<M extends Model<boolean>>(
      oldModel: M,
      newModel: M,
      constructor?: Constructor<M>
    ): M;

    function composed<M extends Model<boolean>>(model: Constructor<M>): boolean;
    function composed<M extends Model<boolean>>(
      model: Constructor<M> | M,
      prop: keyof M
    ): ComposedFromMetadata | undefined;
    function composed<M extends Model<boolean>>(
      model: Constructor<M> | M,
      prop?: keyof M
    ): boolean | ComposedFromMetadata | undefined;

    function generated<M extends Model>(
      model: M | Constructor<M>,
      prop: keyof M
    ): boolean | string;

    function shouldGenerate<M extends Model>(
      model: M,
      prop: keyof M,
      ctx: Context<any>
    ): boolean;

    function versionProp<M extends Model<boolean>>(model: M): keyof M;

    function versionOf<M extends Model<boolean>>(model: M): number;
  }
}
