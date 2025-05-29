import {
  IdOperationHandler,
  OperationHandler,
  StandardOperationHandler,
  UpdateOperationHandler,
} from "./types";
import { DBOperations, OperationKeys } from "./constants";
import { Operations } from "./Operations";
import { apply } from "@decaf-ts/reflection";
import { propMetadata } from "@decaf-ts/decorator-validation";

function handle(
  op: OperationKeys,
  handler: OperationHandler<any, any, any, any, any>
) {
  return (target: any, propertyKey: string) => {
    Operations.register(handler, op, target, propertyKey);
  };
}

/**
 * @description Decorator for handling create and update operations
 * @summary Defines a behavior to execute during both create and update operations
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any> | UpdateOperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onCreateUpdate
 * @category PropertyDecorators
 */
export function onCreateUpdate<V = object>(
  handler:
    | StandardOperationHandler<any, any, V, any, any>
    | UpdateOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return on(DBOperations.CREATE_UPDATE, handler, data);
}
/**
 * @description Decorator for handling update operations
 * @summary Defines a behavior to execute during update operations
 * @template V - Type for metadata, defaults to object
 * @param {UpdateOperationHandler<any, any, V, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onUpdate
 * @category PropertyDecorators
 */
export function onUpdate<V = object>(
  handler: UpdateOperationHandler<any, any, V, any>,
  data?: V
) {
  return on(DBOperations.UPDATE, handler, data);
}
/**
 * @description Decorator for handling create operations
 * @summary Defines a behavior to execute during create operations
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onCreate
 * @category PropertyDecorators
 */
export function onCreate<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return on(DBOperations.CREATE, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.READ}
 *
 * @param {IdOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see on
 *
 * @function onRead
 *
 * @category PropertyDecorators
 */
export function onRead<V = object>(
  handler: IdOperationHandler<any, any, V, any, any>,
  data: V
) {
  return on(DBOperations.READ, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see on
 *
 * @function onDelete
 *
 * @category PropertyDecorators
 */
export function onDelete<V = object>(
  handler: OperationHandler<any, any, V, any, any>,
  data: V
) {
  return on(DBOperations.DELETE, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see on
 *
 * @function onAny
 *
 * @category PropertyDecorators
 */
export function onAny<V = object>(
  handler: OperationHandler<any, any, V, any, any>,
  data: V
) {
  return on(DBOperations.ALL, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} op One of {@link DBOperations}
 * @param {OperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @function on
 *
 * @category PropertyDecorators
 */
export function on<V = object>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  data?: V
) {
  return operation(OperationKeys.ON, op, handler, data);
}
/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {StandardOperationHandler | UpdateOperationHandler} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterCreateUpdate
 *
 * @category PropertyDecorators
 */
export function afterCreateUpdate<V = object>(
  handler:
    | StandardOperationHandler<any, any, V, any, any>
    | UpdateOperationHandler<any, any, V, any, any>,
  data: V
) {
  return after(DBOperations.CREATE_UPDATE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.UPDATE}
 *
 * @param {UpdateOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterUpdate
 *
 * @category PropertyDecorators
 */
export function afterUpdate<V = object>(
  handler: UpdateOperationHandler<any, any, V, any, any>,
  data: V
) {
  return after(DBOperations.UPDATE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE}
 *
 * @param {StandardOperationHandler} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterCreate
 *
 * @category PropertyDecorators
 */
export function afterCreate<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data: V
) {
  return after(DBOperations.CREATE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.READ}
 *
 * @param {StandardOperationHandler} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterRead
 *
 * @category Decorators
 */
export function afterRead<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return after(DBOperations.READ, handler, data);
}
/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {StandardOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterDelete
 *
 * @category PropertyDecorators
 */
export function afterDelete<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return after(DBOperations.DELETE, handler, data);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {StandardOperationHandler<any>} handler The method called upon the operation
 * @param data
 *
 * @see after
 *
 * @function afterAny
 *
 * @category PropertyDecorators
 */
export function afterAny<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return after(DBOperations.ALL, handler, data);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} op One of {@link DBOperations}
 * @param {OperationHandler} handler The method called upon the operation
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @param op
 * @param handler
 * @param data
 * @function after
 *
 * @category PropertyDecorators
 */
export function after<V = object>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  data?: V
) {
  return operation(OperationKeys.AFTER, op, handler, data);
}

export function operation<V = object>(
  baseOp: OperationKeys.ON | OperationKeys.AFTER,
  operation: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  dataToAdd?: V
) {
  return (target: object, propertyKey?: any) => {
    const name = target.constructor.name;
    const decorators = operation.reduce((accum: any[], op) => {
      const compoundKey = baseOp + op;
      let data = Reflect.getMetadata(
        Operations.key(compoundKey),
        target,
        propertyKey
      );
      if (!data)
        data = {
          operation: op,
          handlers: {},
        };

      const handlerKey = Operations.getHandlerName(handler);

      if (
        !data.handlers[name] ||
        !data.handlers[name][propertyKey] ||
        !(handlerKey in data.handlers[name][propertyKey])
      ) {
        data.handlers[name] = data.handlers[name] || {};
        data.handlers[name][propertyKey] =
          data.handlers[name][propertyKey] || {};
        data.handlers[name][propertyKey][handlerKey] = {
          data: dataToAdd,
        };

        accum.push(
          handle(compoundKey as OperationKeys, handler),
          propMetadata(Operations.key(compoundKey), data)
        );
      }
      return accum;
    }, []);
    return apply(...decorators)(target, propertyKey);
  };
}
