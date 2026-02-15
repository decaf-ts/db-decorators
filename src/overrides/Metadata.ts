import "@decaf-ts/decoration";
import type { Constructor } from "@decaf-ts/decoration";
import type { Model } from "@decaf-ts/decorator-validation";

declare module "@decaf-ts/decoration" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Metadata {
    /**
     * @description Saves metadata under a key for a specific operation
     * @summary Saves metadata under a key for a specific operation
     *
     * @template M - The model type extending from Model
     * @param {Constructor<M>} model - The constructor of the target model class
     * @param {keyof M} propertyKey - The property key to store metadata for
     * @param {string} operation - The type of operation being done. Eg. on.update
     * @param {any} metadata - The metadata to store to for the operation
     * @return {void}
     *
     * @example
     * class User extends Model {
     *
     * // Set metatada for 'User' for key updatedOn, for operation on.create
     * Metadata.saveOperation(User.constructor,'updatedOn','on.create',metadata);
     */
    function saveOperation<M extends Model>(
      model: Constructor<M>,
      propertyKey: keyof M,
      operation: string,
      metadata: any
    ): void;

    function pk<M extends Model<boolean>>(model: M | Constructor<M>): keyof M;
    function pk<M extends Model<boolean>>(
      model: M,
      keyValue: boolean
    ): M[keyof M];
    function pk<M extends Model<boolean>>(
      model: M | Constructor<M>,
      keyValue?: boolean
    ): keyof M | M[keyof M];

    /**
     * @description Reads the metadata under a key for a specific operation
     * @summary Reads the metadata under a key for a specific operation
     *
     * @template M - The model type extending from Model
     * @param {Constructor<M>} model - The constructor of the target model class
     * @param {keyof M} propertyKey - The property key to store metadata for
     * @param {string} operation - The type of operation being done. Eg. on.update
     * @return {any} metadata - The metadata to store to for the operation
     *
     * @example
     * class User extends Model {
     *
     * // Get metatada for 'User' for key updatedOn, for operation on.create
     * const metadata = Metadata.readOperation(User.constructor,'updatedOn','on.create');
     */
    function readOperation<M extends Model>(
      model: Constructor<M>,
      propertyKey?: keyof M,
      operation?: string
    ): any;

    /**
     * @description Checks if a model is marked as transient
     * @summary Determines whether a model class has been decorated with the transient decorator
     * @template M - Type extending Model
     * @param {M | Constructor<M>} model - The model instance to check
     * @return {boolean} True if the model is transient, false otherwise
     * @function isTransient
     */
    function isTransient<M extends Model>(model: M | Constructor<M>): boolean;
  }
}
