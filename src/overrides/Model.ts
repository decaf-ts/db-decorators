import { Constructor } from "@decaf-ts/decoration";

declare module "@decaf-ts/decorator-validation" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Model {
    /**
     * @description Retrieves primary key information for a model
     * @summary Retrieves primary key information or it's value for a model from it's metadata.
     *
     * @template model - The model type extending from Model
     * @param {Constructor<M>} model - The constructor of the target model class
     * @param {boolean} returnIdValue - Optional returnIdValue flag, to return the value of the id instead of the property
     * @return {any} The property of the id of the model, or it's value
     *
     * @example
     * class User extends Model {
     *
     *       const idProp = Model.pk(newModel);
     *       const id = Model.pk(newModel, true);
     */
    function pk<M>(model: M, returnIdValue?: boolean): any;

    /**
     * @description Saves primary key information for a model
     * @summary Saves primary key information for a model to metadata.
     *
     * @template model - The model type extending from Model
     * @param {Constructor<M>} model - The constructor of the target model class
     * @param {keyof M} property - The Optional property name to save pk for
     * @return {any} An object of the designtypes
     *
     * @example
     * class User extends Model {
     *
     * // Get the designtypes for property name
     * const validationMetaData = Metadata.get(User.constructor, 'name')
     * const { designTypes, designType } = Metadata.getPropDesignTypes(User.constructor, 'name', validationMetaData?.validation);
     */
    function pkDef<M>(model: Constructor<M>, property?: keyof M): void;
  }
}
