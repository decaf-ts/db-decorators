import { Operations } from "../operations/Operations";
import { OperationHandler, UpdateOperationHandler } from "../operations/types";
import { IRepository } from "../interfaces/IRepository";
import { OperationKeys } from "../operations/constants";
import { DecoratorMetadata, Reflection } from "@decaf-ts/reflection";
import { InternalError } from "./errors";
import {
  Constructor,
  Model,
  ModelKeys,
  sf,
} from "@decaf-ts/decorator-validation";
import { Context } from "./Context";
import { RepositoryFlags } from "./types";

export type ContextArgs<
  C extends Context<F>,
  F extends RepositoryFlags = RepositoryFlags,
> = {
  context: C;
  args: any[];
};

/**
 * @summary retrieves the arguments for the handler
 * @param {any} dec the decorator
 * @param {string} prop the property name
 * @param {{}} m the model
 * @param {{}} [accum] accumulator used for internal recursiveness
 *
 * @function getHandlerArgs
 * @memberOf module:db-decorators.Repository
 */
export const getHandlerArgs = function (
  dec: any,
  prop: string,
  m: Constructor<any>,
  accum?: Record<string, { args: string[] }>
): Record<string, { args: string[] }> | void {
  const name = m.constructor.name;
  if (!name) throw new InternalError("Could not determine model class");
  accum = accum || {};

  if (dec.props.handlers[name] && dec.props.handlers[name][prop])
    accum = { ...dec.props.handlers[name][prop], ...accum };

  let proto = Object.getPrototypeOf(m);
  if (proto === Object.prototype) return accum;
  if (proto.constructor.name === name) proto = Object.getPrototypeOf(proto);

  return getHandlerArgs(dec, prop, proto, accum);
};

/**
 *
 * @param {IRepository<T>} repo
 * @param context
 * @param {T} model
 * @param operation
 * @param prefix
 *
 * @param oldModel
 * @function enforceDBDecorators
 *
 * @memberOf db-decorators.utils
 */
export async function enforceDBDecorators<
  M extends Model,
  R extends IRepository<M, C, F>,
  V extends object = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(
  repo: R,
  context: C,
  model: M,
  operation: string,
  prefix: string,
  oldModel?: M
): Promise<void> {
  const decorators: Record<string, DecoratorMetadata[]> | undefined =
    getDbDecorators(model, operation, prefix);

  if (!decorators) return;

  for (const prop in decorators) {
    const decs: DecoratorMetadata[] = decorators[prop];
    for (const dec of decs) {
      const { key } = dec;
      const handlers: OperationHandler<M, R, V, F, C>[] | undefined =
        Operations.get(model, prop, prefix + key);
      if (!handlers || !handlers.length)
        throw new InternalError(
          `Could not find registered handler for the operation ${prefix + key} under property ${prop}`
        );

      const handlerArgs = getHandlerArgs(dec, prop, model as any);

      if (!handlerArgs || Object.values(handlerArgs).length !== handlers.length)
        throw new InternalError(sf("Args and handlers length do not match"));

      let handler: OperationHandler<M, R, V, F, C>;
      let data: any;
      for (let i = 0; i < handlers.length; i++) {
        handler = handlers[i];
        data = Object.values(handlerArgs)[i];

        const args: any[] = [context, data.data, prop, model];

        if (operation === OperationKeys.UPDATE && prefix === OperationKeys.ON) {
          if (!oldModel)
            throw new InternalError("Missing old model for update operation");
          args.push(oldModel);
        }
        await (handler as UpdateOperationHandler<M, R, V, F, C>).apply(
          repo,
          args as [C, V, keyof M, M, M]
        );
      }
    }
  }
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
export function getDbDecorators<T extends Model>(
  model: T,
  operation: string,
  extraPrefix?: string
): Record<string, DecoratorMetadata[]> | undefined {
  const decorators: Record<string, DecoratorMetadata[]> | undefined =
    Reflection.getAllPropertyDecorators(
      model,
      // undefined,
      OperationKeys.REFLECT + (extraPrefix ? extraPrefix : "")
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
    undefined
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
export const getAllPropertyDecoratorsRecursive = function <T extends Model>(
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
              `^(:?${OperationKeys.ON}|${OperationKeys.AFTER})(:?${OperationKeys.CREATE}|${OperationKeys.READ}|${OperationKeys.UPDATE}|${OperationKeys.DELETE})$`
            )
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
                      handlerProp
                    )
                  );
                }
              );
            }
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
    Reflection.getAllPropertyDecorators(model, ...prefixes);
  if (decs) mergeDecorators(decs);

  if (Object.getPrototypeOf(model) === Object.prototype) return accumulator;

  // const name = model.constructor.name;
  const proto = Object.getPrototypeOf(model);
  if (!proto) return accumulator;
  // if (proto.constructor && proto.constructor.name === name)
  //     proto = Object.getPrototypeOf(proto)
  return getAllPropertyDecoratorsRecursive(proto, accumulator, ...prefixes);
};
