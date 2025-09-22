import {
  GeneralOperationHandler,
  GeneralUpdateOperationHandler,
  IdOperationHandler,
  OperationHandler,
  StandardOperationHandler,
  UpdateOperationHandler,
} from "./types";
import { DBOperations, OperationKeys } from "./constants";
import { Operations } from "./Operations";
import { apply } from "@decaf-ts/reflection";
import { Model, propMetadata } from "@decaf-ts/decorator-validation";
import {
  Context,
  getHandlerArgs,
  InternalError,
  NotFoundError,
  RepositoryFlags,
} from "../repository";
import { IRepository } from "../interfaces";

/**
 * @description Represents sorting parameters for grouping decorators
 * @summary Defines the structure for specifying group sorting options
 * @typedef {Object} GroupSort
 * @property {number} priority - The priority of the sorting operation, lower numbers represent higher priority
 * @property {string} [group] - Optional property to group decorators, used for grouping related operations
 * @property {number} [groupPriority] - Optional property to specify the priority within a group, lower numbers represent higher priority within the group
 * @category Type Definitions
 */
export type GroupSort = {
  priority: number;
  group?: string;
  groupPriority?: number;
};

const defaultPriority = 50;

const DefaultGroupSort: GroupSort = { priority: defaultPriority };

/**
 * @description DecoratorObject type definition
 * @summary Defines the structure of an object used to represent a decorator in the context of database operations.
 * @typedef {Object} DecoratorObject
 * @property {OperationHandler<any, any, any, any, any>} handler - The handler function to be executed during the operation
 * @property {object} data - Optional metadata to be passed to the handler function
 * @property {string} prop - The property key to which the decorator is applied
 * @category Type Definitions
 */
export type DecoratorObject = {
  handler: OperationHandler<any, any, any, any, any>;
  data: Record<string, any>[];
  prop: string[];
};

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
 * @description Retrieves decorator objects for handling database operations
 * @summary Retrieves a list of decorator objects representing operation handlers for a given model and decorators
 * @template M - Type for the model, defaults to Model<true | false>
 * @template R - Type for the repository, defaults to IRepository<M, F, C>
 * @template V - Type for metadata, defaults to object
 * @template F - Type for repository flags, defaults to RepositoryFlags
 * @template C - Type for context, defaults to Context<F>
 * @param {Model} model - The model for which to retrieve decorator objects
 * @param {Record<string, DecoratorMetadata[]>} decorators - The decorators associated with the model properties
 * @param {string} prefix - The operation prefix (e.g., 'on', 'after')
 * @return {DecoratorObject[]} An array of decorator objects representing operation handlers
 * @function getHandlersDecorators
 * @category Function
 */
export function getHandlersDecorators<
  M extends Model<true | false>,
  R extends IRepository<M, F, C>,
  V extends object = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(
  model: Model,
  decorators: Record<string, DecoratorMetadata[]>,
  prefix: string
): DecoratorObject[] {
  const accum: DecoratorObject[] = [];
  for (const prop in decorators) {
    const decs: DecoratorMetadata[] = decorators[prop];
    for (const dec of decs) {
      const { key } = dec!;
      const handlers: OperationHandler<M, R, V, F, C>[] | undefined =
        Operations.get<M, R, V, F, C>(model, prop, prefix + key);
      if (!handlers || !handlers.length)
        throw new InternalError(
          `Could not find registered handler for the operation ${prefix + key} under property ${prop}`
        );

      const handlerArgs = getHandlerArgs(dec, prop, model as any);

      if (!handlerArgs || Object.values(handlerArgs).length !== handlers.length)
        throw new InternalError("Args and handlers length do not match");

      for (let i = 0; i < handlers.length; i++) {
        const data = (handlerArgs[handlers[i].name] as Record<string, any>)
          .data;
        accum.push({
          handler: handlers[i],
          data: [data],
          prop: [prop],
        });
      }
    }
  }
  return accum;
}

/**
 * @description Groups decorators based on their group property
 * @summary Groups decorator objects by their group property, combining data and properties within each group
 * @param {DecoratorObject[]} decorators - The array of decorator objects to group
 * @return {DecoratorObject[]} An array of grouped decorator objects
 * @function groupDecorators
 * @category Function
 */
export function groupDecorators(
  decorators: DecoratorObject[]
): DecoratorObject[] {
  const grouped = decorators.reduce<Map<string | symbol, DecoratorObject>>(
    (acc, dec) => {
      if (!dec || !dec.data || !dec.prop)
        throw new InternalError("Missing decorator properties or data");

      // If decorator have no group
      if (!dec.data[0].group) {
        acc.set(Symbol(), dec);
        return acc;
      }

      const groupKey = dec.data[0].group;

      if (!acc.has(groupKey)) {
        // first handler is saved in the group
        acc.set(groupKey, { ...dec });
      } else {
        const existing = acc.get(groupKey)!;

        acc.set(groupKey, {
          handler: existing.handler,
          data: [...existing.data, ...dec.data],
          prop: [...existing.prop, ...dec.prop],
        });
      }

      return acc;
    },
    new Map()
  );

  const groups = Array.from(grouped.values());

  // Sort inside each group by priority
  groups.forEach((group) => {
    const combined = group.data.map((d, i) => ({
      data: d,
      prop: group.prop[i],
    }));

    combined.sort(
      (a, b) => (a.data.groupPriority ?? 50) - (b.data.groupPriority ?? 50)
    );

    group.data = combined.map((c) => c.data);
    group.prop = combined.map((c) => c.prop);
  });

  return groups;
}

/**
 * @description Sorts decorator objects based on their priority
 * @summary Sorts an array of decorator objects by the priority of their first data element
 * @param {DecoratorObject[]} decorators - The array of decorator objects to sort
 * @return {DecoratorObject[]} The sorted array of decorator objects
 * @function sortDecorators
 * @category Function
 */
export function sortDecorators(
  decorators: DecoratorObject[]
): DecoratorObject[] {
  // Sort by groupPriority
  decorators.sort((a, b) => {
    const priorityA = a.data[0].priority ?? defaultPriority;
    const priorityB = b.data[0].priority ?? defaultPriority;
    return priorityA - priorityB; // lower number = higher priority
  });

  return decorators;
}

/**
 * @description Decorator for handling create and update operations
 * @summary Defines a behavior to execute during both create and update operations
 * @template V - Type for metadata, defaults to object
 * @param {GeneralOperationHandler<any, any, V, any, any> | GeneralUpdateOperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onCreateUpdate
 * @category Property Decorators
 */
export function onCreateUpdate<V extends object>(
  handler:
    | GeneralOperationHandler<any, any, V, any, any>
    | GeneralUpdateOperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return on(DBOperations.CREATE_UPDATE, handler, data, groupsort);
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
export function onUpdate<V extends object>(
  handler: UpdateOperationHandler<any, any, V, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return on(DBOperations.UPDATE, handler, data, groupsort);
}
/**
 * @description Decorator for handling create operations
 * @summary Defines a behavior to execute during create operations
 * @template V - Type for metadata, defaults to object
 * @param {GeneralOperationHandler<any, any, V, any, any>} handler - The method called upon the operation
 * @param {V} [data] - Optional metadata to pass to the handler
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function onCreate
 * @category Property Decorators
 */
export function onCreate<V extends object>(
  handler: GeneralOperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return on(DBOperations.CREATE, handler, data, groupsort);
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
export function onRead<V extends object>(
  handler: IdOperationHandler<any, any, V, any, any>,
  data: V,
  groupsort?: GroupSort
) {
  return on(DBOperations.READ, handler, data, groupsort);
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
export function onDelete<V extends object>(
  handler: OperationHandler<any, any, V, any, any>,
  data: V,
  groupsort?: GroupSort
) {
  return on(DBOperations.DELETE, handler, data, groupsort);
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
export function onAny<V extends object>(
  handler: OperationHandler<any, any, V, any, any>,
  data: V,
  groupsort?: GroupSort
) {
  return on(DBOperations.ALL, handler, data, groupsort);
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
export function on<V extends object>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return operation(OperationKeys.ON, op, handler, data, groupsort);
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
export function afterCreateUpdate<V extends object>(
  handler:
    | StandardOperationHandler<any, any, V, any, any>
    | UpdateOperationHandler<any, any, V, any, any>,
  data: V,
  groupsort?: GroupSort
) {
  return after(DBOperations.CREATE_UPDATE, handler, data, groupsort);
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
export function afterUpdate<V extends object>(
  handler: UpdateOperationHandler<any, any, V, any, any>,
  data: V,
  groupsort?: GroupSort
) {
  return after(DBOperations.UPDATE, handler, data, groupsort);
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
export function afterCreate<V extends object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data: V,
  groupsort?: GroupSort
) {
  return after(DBOperations.CREATE, handler, data, groupsort);
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
export function afterRead<V extends object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return after(DBOperations.READ, handler, data, groupsort);
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
export function afterDelete<V extends object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return after(DBOperations.DELETE, handler, data, groupsort);
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
export function afterAny<V extends object>(
  handler: StandardOperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return after(DBOperations.ALL, handler, data, groupsort);
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
export function after<V extends object>(
  op: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  data?: V,
  groupsort?: GroupSort
) {
  return operation(OperationKeys.AFTER, op, handler, data, groupsort);
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
export function operation<V extends object>(
  baseOp: OperationKeys.ON | OperationKeys.AFTER,
  operation: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any, V, any, any>,
  dataToAdd?: V,
  groupsort: GroupSort = DefaultGroupSort
) {
  return (target: any, propertyKey?: any) => {
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

      let mergeData = groupsort;

      if (dataToAdd) {
        if (Object.keys(dataToAdd).filter((key) => key in groupsort).length > 0)
          throw new InternalError(
            `Unable to merge groupSort into dataToAdd due to overlaping keys`
          );

        mergeData = { ...groupsort, ...dataToAdd };
      }

      if (
        !data.handlers[name] ||
        !data.handlers[name][propertyKey] ||
        !(handlerKey in data.handlers[name][propertyKey])
      ) {
        data.handlers[name] = data.handlers[name] || {};
        data.handlers[name][propertyKey] =
          data.handlers[name][propertyKey] || {};
        data.handlers[name][propertyKey][handlerKey] = {
          data: mergeData,
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
