import { Constructor } from "@decaf-ts/decoration";

declare module "@decaf-ts/decoration" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Metadata {
    /**
     * @description Retrieves primary key information for a model
     * @summary Retrieves primary key information for a model from it's metadata.
     *
     * @template model - The model type extending from Model
     * @param {Constructor<M>} model - The constructor of the target model class
     * @return {any} An object of the designtypes
     *
     * @example
     * class User extends Model {
     *
     * // Get the designtypes for property name
     * const validationMetaData = Metadata.get(User.constructor, 'name')
     * const { designTypes, designType } = Metadata.getPropDesignTypes(User.constructor, 'name', validationMetaData?.validation);
     */
    function pk<M>(model: Constructor<M>): any;

    /**
     * @description Saves primary key information for a model
     * @summary Saves primary key information for a model to metadata.
     *
     * @template model - The model type extending from Model
     * @param {Constructor<M>} model - The constructor of the target model class
     * @param {keyof M} property - The property name to save pk for
     * @return {any} An object of the designtypes
     *
     * @example
     * class User extends Model {
     *
     * // Get the designtypes for property name
     * const validationMetaData = Metadata.get(User.constructor, 'name')
     * const { designTypes, designType } = Metadata.getPropDesignTypes(User.constructor, 'name', validationMetaData?.validation);
     */
    function pkDef<M>(model: Constructor<M>, property: keyof M): void;
  }
}
