import { DBModel } from "../model/DBModel";
import { Operations } from "../operations/Operations";
import { OperationHandler } from "../operations/types";
import { IRepository } from "../interfaces/IRepository";
import { getAllPropertyDecorators } from "@decaf-ts/decorator-validation";
import { OperationKeys } from "../operations/constants";
import { DecoratorMetadata } from "@decaf-ts/decorator-validation";
import { InternalError } from "./errors";

/**
 *
 * @param {IRepository<T>} repo
 * @param {T} model
 * @param operation
 * @param prefix
 *
 * @param oldModel
 * @function enforceDBPropertyDecoratorsAsync
 *
 * @memberOf db-decorators.utils
 */
export function enforceDBDecorators<
  T extends DBModel,
  Y extends IRepository<T>,
>(repo: Y, model: T, operation: string, prefix: string, oldModel?: T) {
  const decorators: Record<string, DecoratorMetadata[]> = getDbDecorators(
    model,
    operation,
    prefix,
  );

  const propIterator = async function (props: string[]) {
    const prop: string | undefined = props.shift();
    if (!prop) return model;

    const decs: any[] = decorators[prop];
    const handler: OperationHandler<T, Y> | undefined = Operations.get(
      model.constructor.name,
      prop,
      decs[0].key,
    );
    if (!handler)
      throw new InternalError(
        `Could not find registered handler for the operation ${prop}`,
      );

    const args: any[] = [repo, model];

    if (operation === OperationKeys.UPDATE) {
      if (!oldModel) throw new InternalError("Missing old model argument");
      args.push(oldModel);
    }

    args.push(...decs[0].props.args, ...decs[0].props.props);

    await handler.call(...args);
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
): Record<string, DecoratorMetadata[]> | undefined {
  const decorators: Record<string, DecoratorMetadata[]> =
    getAllPropertyDecorators(
      model,
      OperationKeys.REFLECT + (extraPrefix ? extraPrefix : ""),
    );
  if (!decorators) return;
  return Object.keys(decorators).reduce(
    (accum: Record<string, DecoratorMetadata[]> | undefined, decorator) => {
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
