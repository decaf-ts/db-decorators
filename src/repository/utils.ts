import { IRepository } from "../interfaces/IRepository";
import { ModelOperations, OperationKeys } from "../operations/constants";
import { DecoratorMetadata, Reflection } from "@decaf-ts/reflection";
import { InternalError } from "./errors";
import { Model, ModelKeys } from "@decaf-ts/decorator-validation";
import { Context } from "./Context";
import { RepositoryFlags } from "./types";
import {
  getHandlersDecorators,
  groupDecorators,
  sortDecorators,
} from "../operations/decorators";
import { UpdateOperationHandler } from "../operations/types";
import { Constructor, Metadata } from "@decaf-ts/decoration";

/**
 * @description Context arguments for repository operations.
 * @summary Represents the context and arguments for repository operations.
 * This type is used to pass context and arguments between repository methods.
 * @template F - The repository flags type, defaults to RepositoryFlags
 * @template C - The context type, defaults to Context<F>
 * @typedef {Object} ContextArgs
 * @property {C} context - The operation context
 * @property {any[]} args - The operation arguments
 * @memberOf module:db-decorators
 */
export type ContextArgs<
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
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
 * @function enforceDBPropertyDecoratorsAsync
 *
 * @memberOf db-decorators.utils
 */
export async function enforceDBDecorators<
  M extends Model<true | false>,
  R extends IRepository<M, F, C>,
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

  const hanlersDecorators = getHandlersDecorators(model, decorators, prefix);
  const groupedDecorators = groupDecorators(hanlersDecorators);
  const sortedDecorators = sortDecorators(groupedDecorators);

  for (const dec of sortedDecorators) {
    const args: any[] = [
      context,
      dec.data.length > 1 ? dec.data : dec.data[0],
      dec.prop.length > 1 ? dec.prop : dec.prop[0],
      model,
    ];

    if (operation === OperationKeys.UPDATE && prefix === OperationKeys.ON) {
      if (!oldModel)
        throw new InternalError("Missing old model for update operation");
      args.push(oldModel);
    }
    try {
      await (dec.handler as UpdateOperationHandler<M, R, V, F, C>).apply(
        repo,
        args as [C, V, keyof M, M, M]
      );
    } catch (e: unknown) {
      const msg = `Failed to execute handler ${dec.handler.name} for ${dec.prop} on ${model.constructor.name} due to error: ${e}`;
      if (context.get("breakOnHandlerError")) throw new InternalError(msg);
      console.log(msg);
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
  const prefix = extraPrefix?.replace(/[.]$/, "");

  const decorators = Metadata.get(
    model.constructor as Constructor<T>,
    ModelOperations.OPERATIONS
  );

  if (!decorators) return;
  return Object.keys(decorators).reduce(
    (accum: Record<string, DecoratorMetadata[]> | undefined, decorator) => {
      const obj = prefix
        ? decorators[decorator][prefix] || {}
        : decorators[decorator];
      const dec = Object.keys(obj).filter((d: any) => d === operation);
      const decs = [];
      for (const d of dec) decs.push({ key: d, props: obj[d] });

      if (decs && decs.length) {
        if (!accum) accum = {};
        accum[decorator] = decs;
      }
      return accum;
    },
    undefined
  );
}

// /**
//  * @summary Retrieves the decorators for an object's properties prefixed by {@param prefixes} recursively
//  * @param model
//  * @param accum
//  * @param prefixes
//  *
//  * @function getAllPropertyDecoratorsRecursive
//  * @memberOf module:db-decorators.Repository
//  */
// export const getAllPropertyDecoratorsRecursive = function <T extends Model>(
//   model: T,
//   accum: { [indexer: string]: any[] } | undefined,
//   ...prefixes: string[]
// ): { [indexer: string]: any[] } | undefined {
//   const accumulator = accum || {};
//   const mergeDecorators = function (decs: { [indexer: string]: any[] }) {
//     const pushOrSquash = (key: string, ...values: any[]) => {
//       values.forEach((val) => {
//         let match: any;
//         if (
//           !(match = accumulator[key].find((e) => e.key === val.key)) ||
//           match.props.operation !== val.props.operation
//         ) {
//           accumulator[key].push(val);
//           return;
//         }

//         if (val.key === ModelKeys.TYPE) return;

//         const { handlers, operation } = val.props;

//         if (
//           !operation ||
//           !operation.match(
//             new RegExp(
//               `^(:?${OperationKeys.ON}|${OperationKeys.AFTER})(:?${OperationKeys.CREATE}|${OperationKeys.READ}|${OperationKeys.UPDATE}|${OperationKeys.DELETE})$`
//             )
//           )
//         ) {
//           accumulator[key].push(val);
//           return;
//         }

//         const accumHandlers = match.props.handlers;

//         Object.entries(handlers).forEach(([clazz, handlerDef]) => {
//           if (!(clazz in accumHandlers)) {
//             accumHandlers[clazz] = handlerDef;
//             return;
//           }

//           Object.entries(handlerDef as object).forEach(
//             ([handlerProp, handler]) => {
//               if (!(handlerProp in accumHandlers[clazz])) {
//                 accumHandlers[clazz][handlerProp] = handler;
//                 return;
//               }

//               Object.entries(handler as object).forEach(
//                 ([handlerKey, argsObj]) => {
//                   if (!(handlerKey in accumHandlers[clazz][handlerProp])) {
//                     accumHandlers[clazz][handlerProp][handlerKey] = argsObj;
//                     return;
//                   }
//                   console.warn(
//                     `Skipping handler registration for ${clazz} under prop ${handlerProp} because handler is the same`
//                   );
//                 }
//               );
//             }
//           );
//         });
//       });
//     };

//     Object.entries(decs).forEach(([key, value]) => {
//       accumulator[key] = accumulator[key] || [];
//       pushOrSquash(key, ...value);
//     });
//   };

//   const decs: { [indexer: string]: any[] } | undefined =
//     Reflection.getAllPropertyDecorators(model, ...prefixes);
//   if (decs) mergeDecorators(decs);

//   if (Object.getPrototypeOf(model) === Object.prototype) return accumulator;

//   // const name = model.constructor.name;
//   const proto = Object.getPrototypeOf(model);
//   if (!proto) return accumulator;
//   // if (proto.constructor && proto.constructor.name === name)
//   //     proto = Object.getPrototypeOf(proto)
//   return getAllPropertyDecoratorsRecursive(proto, accumulator, ...prefixes);
// };
