import { DBKeys } from "../model/constants";
import { Model } from "@decaf-ts/decorator-validation";
import { Metadata } from "@decaf-ts/decoration";

/**
 * @description Finds the primary key attribute for a model
 * @summary Searches in all the properties in the object for an {@link id} decorated property and returns the property key and metadata
 * @param {Model} model - The model object to search for primary key
 * @return {Object} An object containing the id property name and its metadata
 * @function findPrimaryKey
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant findPrimaryKey
 *   participant getAllPropertyDecoratorsRecursive
 *
 *   Caller->>findPrimaryKey: model
 *   findPrimaryKey->>getAllPropertyDecoratorsRecursive: get decorators
 *   getAllPropertyDecoratorsRecursive-->>findPrimaryKey: decorators
 *   findPrimaryKey->>findPrimaryKey: filter ID decorators
 *   findPrimaryKey->>findPrimaryKey: validate single ID property
 *   findPrimaryKey-->>Caller: {id, props}
 * @memberOf module:db-decorators
 */
export function findPrimaryKey<M extends Model>(model: M) {
  const idProp = Model.pk(model);
  return {
    id: idProp as keyof M,
    props: Metadata.get(
      model.constructor as any,
      Metadata.key(DBKeys.ID, idProp)
    ),
  };
}

/**
 * @description Retrieves the primary key value from a model
 * @summary Searches for the ID-decorated property in the model and returns its value
 * @param {Model} model - The model object to extract the ID from
 * @param {boolean} [returnEmpty=false] - Whether to return undefined if no ID value is found
 * @return {string | number | bigint} The primary key value
 * @function findModelId
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant findModelId
 *   participant findPrimaryKey
 *
 *   Caller->>findModelId: model, returnEmpty
 *   findModelId->>findPrimaryKey: model
 *   findPrimaryKey-->>findModelId: {id, props}
 *   findModelId->>findModelId: extract model[id]
 *   findModelId->>findModelId: validate ID exists if required
 *   findModelId-->>Caller: ID value
 * @memberOf module:db-decorators
 */
export function findModelId<M extends Model>(
  model: M,
  returnEmpty = false
): string | number | bigint {
  return Model.pk(model, true) as string | number | bigint;
}
