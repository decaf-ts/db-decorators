import { DBModel } from "../model/DBModel";
import { Operations } from "../operations/Operations";
import { OperationHandler, UpdateOperationHandler } from "../operations/types";
import { IRepository } from "../interfaces/IRepository";
import { OperationKeys } from "../operations/constants";
import {
  DecoratorMetadata,
  getAllPropertyDecorators,
} from "@decaf-ts/reflection";
import { InternalError } from "./errors";
import { ModelKeys, sf } from "@decaf-ts/decorator-validation";

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
export async function enforceDBDecorators<
  T extends DBModel,
  Y extends IRepository<T>,
  V,
>(
  repo: Y,
  model: T,
  operation: string,
  prefix: string,
  oldModel?: T,
): Promise<void> {
  const decorators: Record<string, DecoratorMetadata[]> | undefined =
    getDbDecorators(model, operation, prefix);

  if (!decorators) return;

  const propIterator = async function (props: string[]): Promise<void> {
    const prop: string | undefined = props.shift();
    if (!prop) return;

    const decs: DecoratorMetadata[] = decorators[prop];
    for (const dec of decs) {
      const { key, props } = dec;
      const handler: OperationHandler<T, Y, V> | undefined = Operations.get(
        model.constructor.name,
        prop,
        key,
      );
      if (!handler)
        throw new InternalError(
          `Could not find registered handler for the operation ${prop}`,
        );
      const args: any[] = [props, prop, model];

      if (operation === OperationKeys.UPDATE) {
        if (!oldModel) throw new InternalError("Missing old model argument");
        args.push(oldModel);
      }
      await Promise.resolve(
        (handler as UpdateOperationHandler<T, Y, V>).apply(
          repo,
          args as [V, any, T, T],
        ),
      );
    }
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
  const decorators: Record<string, DecoratorMetadata[]> | undefined =
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

/**
 * @summary Retrieves the decorators for an object's properties prefixed by {@param prefixes} recursively
 * @param model
 * @param accum
 * @param prefixes
 *
 * @function getAllPropertyDecoratorsRecursive
 * @memberOf module:db-decorators.Repository
 */
export const getAllPropertyDecoratorsRecursive = function <T extends DBModel>(
  model: T,
  accum: { [indexer: string]: any[] } | undefined,
  ...prefixes: string[]
): { [indexer: string]: any[] } | undefined {
  const accumulator = accum || {};
  const mergeDecorators = function (decs: { [indexer: string]: any[] }) {
    const pushOrSquash = (key: string, ...values: any[]) => {
      values.forEach((val) => {
        let match: any;
        if (
          !(match = accumulator[key].find((e) => e.key === val.key)) ||
          match.props.operation !== val.props.operation
        ) {
          accumulator[key].push(val);
          return;
        }

        if (val.key === ModelKeys.TYPE) return;

        const { handlers, operation } = val.props;

        if (
          !operation ||
          !operation.match(
            new RegExp(
              `^(:?${OperationKeys.ON}|${OperationKeys.AFTER})(:?${OperationKeys.CREATE}|${OperationKeys.READ}|${OperationKeys.UPDATE}|${OperationKeys.DELETE})$`,
            ),
          )
        ) {
          accumulator[key].push(val);
          return;
        }

        const accumHandlers = match.props.handlers;

        Object.entries(handlers).forEach(([clazz, handlerDef]) => {
          if (!(clazz in accumHandlers)) {
            accumHandlers[clazz] = handlerDef;
            return;
          }

          Object.entries(handlerDef as object).forEach(
            ([handlerProp, handler]) => {
              if (!(handlerProp in accumHandlers[clazz])) {
                accumHandlers[clazz][handlerProp] = handler;
                return;
              }

              Object.entries(handler as object).forEach(
                ([handlerKey, argsObj]) => {
                  if (!(handlerKey in accumHandlers[clazz][handlerProp])) {
                    accumHandlers[clazz][handlerProp][handlerKey] = argsObj;
                    return;
                  }
                  console.warn(
                    sf(
                      "Skipping handler registration for {0} under prop {0} because handler is the same",
                      clazz,
                      handlerProp,
                    ),
                  );
                },
              );
            },
          );
        });
      });
    };

    Object.entries(decs).forEach(([key, value]) => {
      accumulator[key] = accumulator[key] || [];
      pushOrSquash(key, ...value);
    });
  };

  const decs: { [indexer: string]: any[] } | undefined =
    getAllPropertyDecorators(model, ...prefixes);
  if (decs) mergeDecorators(decs);

  if (Object.getPrototypeOf(model) === Object.prototype) return accumulator;

  // const name = model.constructor.name;
  const proto = Object.getPrototypeOf(model);
  if (!proto) return accumulator;
  // if (proto.constructor && proto.constructor.name === name)
  //     proto = Object.getPrototypeOf(proto)
  return getAllPropertyDecoratorsRecursive(proto, accumulator, ...prefixes);
};
