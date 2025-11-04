import { Constructor } from "@decaf-ts/decoration";

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
    function saveOperation<M>(
      model: Constructor<M>,
      propertyKey: keyof M,
      operation: string,
      metadata: any
    ): void;

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
    function readOperation<M>(
      model: Constructor<M>,
      propertyKey?: keyof M,
      operation?: string
    ): any;
  }
}
