import { DBModel } from "../model/DBModel";
import { getDBKey } from "../model/decorators";
import { DBKeys } from "../model/constants";
import { getAllPropertyDecoratorsRecursive } from "../repository/utils";
import { Constructor, ModelKeys, sf } from "@decaf-ts/decorator-validation";
import { InternalError, NotFoundError } from "../repository/errors";
import { IRepository } from "../interfaces/IRepository";

/**
 * @summary Returns the primary key attribute for a {@link DBModel}
 * @description searches in all the properties in the object for an {@link id} decorated property
 *
 * @param {DBModel} model
 *
 * @throws {InternalError} if no property or more than one properties are {@link id} decorated
 * or no value is set in that property
 *
 * @function findPrimaryKey
 *
 * @category managers
 */
export function findPrimaryKey<T extends DBModel>(model: T) {
  const decorators = getAllPropertyDecoratorsRecursive(
    model,
    undefined,
    getDBKey(DBKeys.ID),
  );
  const idDecorators = Object.entries(decorators as object).reduce(
    (accum: { [indexer: string]: any[] }, [prop, decs]) => {
      const filtered = (decs as { key: string }[]).filter(
        (d) => d.key !== ModelKeys.TYPE,
      );
      if (filtered && filtered.length) {
        accum[prop] = accum[prop] || [];
        accum[prop].push(...filtered);
      }
      return accum;
    },
    {},
  );

  if (!idDecorators || !Object.keys(idDecorators).length)
    throw new InternalError("Could not find ID decorated Property");
  if (Object.keys(idDecorators).length > 1)
    throw new InternalError(sf(Object.keys(idDecorators).join(", ")));
  const idProp = Object.keys(idDecorators)[0];
  if (!idProp) throw new InternalError("Could not find ID decorated Property");
  return {
    id: idProp,
    props: idDecorators[idProp][0].props.options,
  };
}

/**
 * @summary Returns the primary key value for a {@link DBModel}
 * @description searches in all the properties in the object for an {@link pk} decorated property
 *
 * @param {DBModel} model
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
export function findModelId(model: DBModel, returnEmpty = false) {
  const idProp = findPrimaryKey(model).id;
  const modelId = model[idProp];
  if (!modelId && !returnEmpty)
    throw new NotFoundError(
      sf("No value for the Id is defined under the property {0}", idProp),
    );
  return modelId;
}

export async function createOrUpdate<T extends DBModel>(
  model: T,
  manager: IRepository<T> | undefined = undefined,
  pk?: string,
): Promise<T> {
  if (!manager)
    manager = DBModel.findRepository(model.constructor as Constructor<T>);

  if (!pk) pk = findPrimaryKey(model).id;
  if (typeof (model as Record<string, any>)[pk] === "undefined")
    return manager.create(model);
  else {
    return await manager.update(model);
  }
}
