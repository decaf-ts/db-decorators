import { DBModel } from "../model/DBModel";
import { Operations } from "../operations/Operations";
import { OperationHandler } from "../operations/types";
import { IRepository } from "../interfaces/IRepository";

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
  decorators: { [indexer: string]: { [indexer: string]: any[] } },
  keyPrefix: string = "",
) {
  const propIterator = async function (props: string[]) {
    const prop = props.shift();
    if (!prop) return model;

    const decs: any[] = decorators[prop];
    const handler: OperationHandler<T> | undefined = Operations.get(
      model.constructor.name,
      prop,
      keyPrefix + decs[0].key,
    );
    if (!handler)
      throw new Operatio(
        `Could not find registered handler for the operation ${prop}`,
      );

    handler.call(
      repo,
      model,
      ...decs[0].props.args,
      ...decs[0].props.props,
      (err: Err) => {
        if (err) return callback(err);
        propIterator(props, callback);
      },
    );
  };

  propIterator(Object.keys(decorators), (err: Err, model?: T) => {
    if (err) return callback(err);
    callback(undefined, model);
  });
}
