import {
  IdOperationHandler,
  OperationHandler,
  OperationMetadata,
  StandardOperationHandler,
  UpdateOperationHandler,
} from "./types";
import { DBOperations, OperationKeys } from "./constants";
import { Operations } from "./Operations";
import { apply, CustomDecorator, metadata } from "@decaf-ts/reflection";

function handle(op: OperationKeys, handler: OperationHandler<any, any, any>) {
  return (target: any, propertyKey: string) => {
    Operations.register(handler, op, target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param data
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onCreateUpdate
 *
 * @category Decorators
 */
export function onCreateUpdate<T>(
  handler:
    | StandardOperationHandler<any, any, T>
    | UpdateOperationHandler<any, any, T>,
  data?: T,
) {
  return on(DBOperations.CREATE_UPDATE, handler, data);
}
/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param data
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onUpdate
 *
 * @category Decorators
 */
export function onUpdate<T>(
  handler: UpdateOperationHandler<any, any, T>,
  data?: T,
) {
  return on(DBOperations.UPDATE, handler, data);
}
/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.CREATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param data?
 *
 * @see on
 *
 * @function onCreate
 *
 * @category Decorators
 */
export function onCreate<T>(
  handler: StandardOperationHandler<any, any, T>,
  data?: T,
) {
  return on(DBOperations.CREATE, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.READ}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see on
 *
 * @function onRead
 *
 * @category Decorators
 */
export function onRead<T>(handler: IdOperationHandler<any, any, T>, data: T) {
  return on(DBOperations.READ, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see on
 *
 * @function onDelete
 *
 * @category Decorators
 */
export function onDelete<T>(handler: IdOperationHandler<any, any, T>, data: T) {
  return on(DBOperations.DELETE, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} op One of {@link DBOperations}
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @function on
 *
 * @category Decorators
 */
export function on<T>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, T>,
  data?: T,
) {
  return operation(OperationKeys.ON, op, handler, data);
}
/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterCreateUpdate
 *
 * @category Decorators
 */
export function afterCreateUpdate<T>(
  handler:
    | StandardOperationHandler<any, any, T>
    | UpdateOperationHandler<any, any, T>,
  data: T,
) {
  return after(DBOperations.CREATE_UPDATE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterUpdate
 *
 * @category Decorators
 */
export function afterUpdate<T>(
  handler: UpdateOperationHandler<any, any, T>,
  data: T,
) {
  return after(DBOperations.UPDATE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterCreate
 *
 * @category Decorators
 */
export function afterCreate<T>(
  handler: StandardOperationHandler<any, any, T>,
  data: T,
) {
  return after(DBOperations.CREATE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.READ}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param data
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterRead
 *
 * @category Decorators
 */
export function afterRead<T>(
  handler: StandardOperationHandler<any, any, T>,
  data?: T,
) {
  return after(DBOperations.READ, handler, data);
}
/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param data
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterDelete
 *
 * @category Decorators
 */
export function afterDelete<T>(
  handler: StandardOperationHandler<any, any, T>,
  data?: T,
) {
  return after(DBOperations.DELETE, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} op One of {@link DBOperations}
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @param data
 * @param args
 * @function after
 *
 * @category Decorators
 */
export function after<T>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, T>,
  data?: T,
) {
  return operation(OperationKeys.AFTER, op, handler, data);
}

export function operation<T>(
  baseOp: OperationKeys.ON | OperationKeys.AFTER,
  operation: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, T>,
  data?: T,
) {
  const ops = operation.reduce(
    (accum: CustomDecorator<any>[], op: OperationKeys) => {
      const operat = `${baseOp.toString()}${op.toString()}`;

      const m_data: OperationMetadata<T> = {
        operation: operat as OperationKeys,
        handler: Operations.getHandlerName(handler),
        metadata: data,
      };
      accum.push(
        metadata(Operations.genKey(operat), m_data) as CustomDecorator<any>,
        handle(operat as OperationKeys, handler) as CustomDecorator<any>,
      );
      return accum;
    },
    [],
  );

  return apply(...ops);
}
