import { DBModel } from "../model/DBModel";
import { Operations } from "../operations/Operations";
import { OperationHandler } from "../operations/types";
import { IRepository } from "../interfaces/IRepository";
import { getAllPropertyDecorators } from "@decaf-ts/decorator-validation";
import { OperationKeys } from "../operations/constants";
import { DecoratorMetadata } from "@decaf-ts/decorator-validation";

/**
 *
 * @param {Repository<T>} repo
 * @param {T} model
 * @param {{}} decorators
 * @param {string} [keyPrefix] defaults to ''
 *
 * @function enforceDBPropertyDecoratorsAsync
 *
 * @memberOf db-decorators.utils
 */

export function enforceDBDecorators<T extends DBModel>(
  repo: IRepository<T>,
  model: T,
  decorators: Record<string, any[]>,
  keyPrefix: string = "",
) {
  const propIterator = async function (props: string[]) {
    const prop: string | undefined = props.shift();
    if (!prop) return model;

    const decs: any[] = decorators[prop];
    const handler: OperationHandler<T> | undefined = Operations.get(
      model.constructor.name,
      prop,
      keyPrefix + decs[0].key,
    );
    if (!handler)
      throw new Error(
        `Could not find registered handler for the operation ${prop}`,
      );

    await handler.call(
      repo,
      model,
      ...decs[0].props.args,
      ...decs[0].props.props,
    );
    await propIterator(props);
  };

  return propIterator(Object.keys(decorators));
}
/**
 * Specific for DB Decorators
 * @param {T} model
 * @param {string} operation CRUD {@link OperationKeys}
 * @param {string} [extraPrefix]
 *
 * @function getDbPropertyDecorators
 *
 * @memberOf db-decorators.utils
 */
export function getDbDecorators<T extends DBModel>(
  model: T,
  operation: string,
  extraPrefix?: string,
): { [indexer: string]: { [indexer: string]: any[] } } | undefined {
  const decorators: Record<string, DecoratorMetadata[]> =
    getAllPropertyDecorators(
      model,
      OperationKeys.REFLECT + (extraPrefix ? extraPrefix : ""),
    );
  if (!decorators) return;
  return Object.keys(decorators).reduce(
    (accum: Record<string, any> | undefined, decorator) => {
      const dec = decorators[decorator].filter((d) => d.key === operation);
      if (dec && dec.length) {
        if (!accum) accum = {};
        accum[decorator] = dec;
      }
      return accum;
    },
    undefined,
  );
}
