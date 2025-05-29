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

/**
 * @description Internal function to register operation handlers
 * @summary Registers an operation handler for a specific operation key on a target property
 * @param {OperationKeys} op - The operation key to handle
 * @param {OperationHandler<any, any, any, any, any>} handler - The handler function to register
 * @return {PropertyDecorator} A decorator that registers the handler
 * @function handle
 * @category Property Decorators
 */
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
 * @category Property Decorators
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
 * @category Property Decorators
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
 * @category Property Decorators
 */
export function onCreate<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return on(DBOperations.CREATE, handler, data);
}

/**
 * @description Decorator for handling read operations
 * @summary Defines a behavior to execute during read operations
 * @template V - Type for metadata, defaults to object
 * @param {IdOperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onRead
 * @category Property Decorators
 */
export function onRead<V = object>(
  handler: IdOperationHandler<any, any, V, any, any>,
  data: V
) {
  return on(DBOperations.READ, handler, data);
}

/**
 * @description Decorator for handling delete operations
 * @summary Defines a behavior to execute during delete operations
 * @template V - Type for metadata, defaults to object
 * @param {OperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onDelete
 * @category Property Decorators
 */
export function onDelete<V = object>(
  handler: OperationHandler<any, any, V, any, any>,
  data: V
) {
  return on(DBOperations.DELETE, handler, data);
}

/**
 * @description Decorator for handling all operation types
 * @summary Defines a behavior to execute during any database operation
 * @template V - Type for metadata, defaults to object
 * @param {OperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onAny
 * @category Property Decorators
 */
export function onAny<V = object>(
  handler: OperationHandler<any, any, V, any, any>,
  data: V
) {
  return on(DBOperations.ALL, handler, data);
}

/**
 * @description Base decorator for handling database operations
 * @summary Defines a behavior to execute during specified database operations
 * @template V - Type for metadata, defaults to object
 * @param {OperationKeys[] | DBOperations} [op=DBOperations.ALL] - One or more operation types to handle
 * @param {OperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function on
 * @category Property Decorators
 * @example
 * // Example usage:
 * class MyModel {
 *   @on(DBOperations.CREATE, myHandler)
 *   myProperty: string;
 * }
 */
export function on<V = object>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  data?: V
) {
  return operation(OperationKeys.ON, op, handler, data);
}
/**
 * @description Decorator for handling post-create and post-update operations
 * @summary Defines a behavior to execute after both create and update operations
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any> | UpdateOperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function afterCreateUpdate
 * @category Property Decorators
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
 * @description Decorator for handling post-update operations
 * @summary Defines a behavior to execute after update operations
 * @template V - Type for metadata, defaults to object
 * @param {UpdateOperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function afterUpdate
 * @category Property Decorators
 */
export function afterUpdate<V = object>(
  handler: UpdateOperationHandler<any, any, V, any, any>,
  data: V
) {
  return after(DBOperations.UPDATE, handler, data);
}

/**
 * @description Decorator for handling post-create operations
 * @summary Defines a behavior to execute after create operations
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function afterCreate
 * @category Property Decorators
 */
export function afterCreate<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data: V
) {
  return after(DBOperations.CREATE, handler, data);
}

/**
 * @description Decorator for handling post-read operations
 * @summary Defines a behavior to execute after read operations
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function afterRead
 * @category Property Decorators
 */
export function afterRead<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return after(DBOperations.READ, handler, data);
}
/**
 * @description Decorator for handling post-delete operations
 * @summary Defines a behavior to execute after delete operations
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function afterDelete
 * @category Property Decorators
 */
export function afterDelete<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return after(DBOperations.DELETE, handler, data);
}

/**
 * @description Decorator for handling post-operation for all operation types
 * @summary Defines a behavior to execute after any database operation
 * @template V - Type for metadata, defaults to object
 * @param {StandardOperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function afterAny
 * @category Property Decorators
 */
export function afterAny<V = object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V
) {
  return after(DBOperations.ALL, handler, data);
}

/**
 * @description Base decorator for handling post-operation behaviors
 * @summary Defines a behavior to execute after specified database operations
 * @template V - Type for metadata, defaults to object
 * @param {OperationKeys[] | DBOperations} [op=DBOperations.ALL] - One or more operation types to handle
 * @param {OperationHandler<any, any, V, any, any>} handler - The method called after the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function after
 * @category Property Decorators
 * @example
 * // Example usage:
 * class MyModel {
 *   @after(DBOperations.CREATE, myHandler)
 *   myProperty: string;
 * }
 */
export function after<V = object>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  data?: V
) {
  return operation(OperationKeys.AFTER, op, handler, data);
}

/**
 * @description Core decorator factory for operation handlers
 * @summary Creates decorators that register handlers for database operations
 * @template V - Type for metadata, defaults to object
 * @param {OperationKeys.ON | OperationKeys.AFTER} baseOp - Whether the handler runs during or after the operation
 * @param {OperationKeys[]} [operation=DBOperations.ALL] - The specific operations to handle
 * @param {OperationHandler<any, any, V, any, any>} handler - The handler function to execute
 * @param {V} [dataToAdd] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function operation
 * @category Property Decorators
 * @mermaid
 * sequenceDiagram
 *   participant Client
 *   participant Decorator as @operation
 *   participant Operations as Operations Registry
 *   participant Handler
 *
 *   Client->>Decorator: Apply to property
 *   Decorator->>Operations: Register handler
 *   Decorator->>Decorator: Store metadata
 *
 *   Note over Client,Handler: Later, during operation execution
 *   Client->>Operations: Execute operation
 *   Operations->>Handler: Call registered handler
 *   Handler-->>Operations: Return result
 *   Operations-->>Client: Return final result
 */
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
