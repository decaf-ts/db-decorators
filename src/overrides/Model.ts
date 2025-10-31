import "@decaf-ts/decorator-validation";

declare module "@decaf-ts/decorator-validation" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Model {
    /**
     * @description Retrieves primary key information for a model
     * @summary Retrieves primary key information or it's value for a model from it's metadata.
     *
     * @template model - The model type extending from Model
     * @param {M} model - The model class
     * @param {boolean} keyValue - Optional keyValue flag, to return the value of the id instead of the property
     * @return {any} The property of the id of the model, or it's value
     *
     * @example
     * class User extends Model {
     *
     *       const idProp = Model.pk(newModel);
     *       const id = Model.pk(newModel, true);
     */
    function pk<M>(model: M, keyValue?: boolean): any;
  }
}
