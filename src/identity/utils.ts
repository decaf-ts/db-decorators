import { DBKeys } from "../model/constants";
import { getAllPropertyDecoratorsRecursive } from "../repository/utils";
import { Model, ModelKeys, sf } from "@decaf-ts/decorator-validation";
import { InternalError, NotFoundError } from "../repository/errors";

/**
 * @summary Returns the primary key attribute for a {@link Model}
 * @description searches in all the properties in the object for an {@link id} decorated property
 *
 * @param {Model} model
 *
 * @throws {InternalError} if no property or more than one properties are {@link id} decorated
 * or no value is set in that property
 *
 * @function findPrimaryKey
 *
 * @category managers
 */
export function findPrimaryKey<T extends Model>(model: T) {
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
    id: idProp,
    props: idDecorators[idProp][0].props,
  };
}

/**
 * @summary Returns the primary key value for a {@link Model}
 * @description searches in all the properties in the object for an {@link pk} decorated property
 *
 * @param {Model} model
 * @param {boolean} [returnEmpty]
 * @return {string} primary key
 *
 * @throws {InternalError} if no property or more than one properties are {@link pk} decorated
 * @throws {NotFoundError} returnEmpty is false and no value is set on the {@link pk} decorated property
 *
 * @function findModelID
 *
 * @category managers
 */
export function findModelId(model: Model, returnEmpty = false) {
  const idProp = findPrimaryKey(model).id;
  const modelId = (model as any)[idProp];
  if (!modelId && !returnEmpty)
    throw new NotFoundError(
      sf("No value for the Id is defined under the property {0}", idProp)
    );
  return modelId;
}
