import { DBKeys } from "../model/constants";
import { getAllPropertyDecoratorsRecursive } from "../repository/utils";
import { Model, ModelKeys, sf } from "@decaf-ts/decorator-validation";
import { InternalError } from "../repository/errors";
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
  const idPropnew = Model.pk(model);
  return {
    id: idPropnew as keyof M,
    props: Metadata.get(
      model.constructor as any,
      Metadata.key(DBKeys.ID, idPropnew)
    ),
  };

  const decorators = getAllPropertyDecoratorsRecursive(
    model,
    undefined,
    DBKeys.REFLECT + DBKeys.ID
  );
  const idDecorators = Object.entries(decorators as object).reduce(
    (accum: { [indexer: string]: any[] }, [prop, decs]) => {
      const filtered = (decs as { key: string }[]).filter(
        (d) => d.key !== ModelKeys.TYPE
      );
      if (filtered && filtered.length) {
        accum[prop] = accum[prop] || [];
        accum[prop].push(...filtered);
      }
      return accum;
    },
    {}
  );
  if (!idDecorators || !Object.keys(idDecorators).length)
    throw new InternalError("Could not find ID decorated Property");
  if (Object.keys(idDecorators).length > 1)
    throw new InternalError(sf(Object.keys(idDecorators).join(", ")));
  const idProp = Object.keys(idDecorators)[0];
  if (!idProp) throw new InternalError("Could not find ID decorated Property");
  return {
    id: idProp as keyof M,
    props: idDecorators[idProp][0].props,
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
  const idProp = findPrimaryKey(model).id;
  const modelId = model[idProp];
  if (typeof modelId === "undefined" && !returnEmpty)
    throw new InternalError(
      `No value for the Id is defined under the property ${idProp as string}`
    );
  return modelId as string | number | bigint;
}
