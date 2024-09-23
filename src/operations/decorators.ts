import { AfterOperationHandler, OnOperationHandler } from "./types";
import { DBOperations, OperationKeys } from "./constants";
import { Operations } from "./Operations";

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @function onCreateUpdate
 *
 * @category Decorators
 */
export function onCreateUpdate(
  handler: OnOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    on(
      DBOperations.CREATE_UPDATE,
      handler,
      args,
      ...props,
    )(target, propertyKey);
  };
}
/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @function onUpdate
 *
 * @category Decorators
 */
export function onUpdate(
  handler: OnOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    on(DBOperations.UPDATE, handler, args, ...props)(target, propertyKey);
  };
}
/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.CREATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @function onCreate
 *
 * @category Decorators
 */
export function onCreate(
  handler: OnOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    on(DBOperations.CREATE, handler, args, ...props)(target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.READ}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @function onRead
 *
 * @category Decorators
 */
export function onRead(
  handler: OnOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    on(DBOperations.READ, handler, args, ...props)(target, propertyKey);
  };
}
/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @function onDelete
 *
 * @category Decorators
 */
export function onDelete(
  handler: OnOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    on(
      DBOperations.DELETE as string[],
      handler,
      args,
      ...props,
    )(target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} operation One of {@link DBOperations}
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @function on
 *
 * @category Decorators
 */
export function on(
  operation: OperationKeys[] | DBOperations = DBOperations.ALL,
  handler: OnOperationHandler<any>,
  args: any[] = [],
  ...props: string[]
) {
  return Operations.genDecorator(
    OperationKeys.ON,
    operation as OperationKeys[],
    handler,
    args,
    ...props,
  );
}
/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @function afterCreateUpdate
 *
 * @category Decorators
 */
export function afterCreateUpdate(
  handler: AfterOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    after(
      DBOperations.CREATE_UPDATE,
      handler,
      args,
      ...props,
    )(target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @function afterUpdate
 *
 * @category Decorators
 */
export function afterUpdate(
  handler: AfterOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    after(DBOperations.UPDATE, handler, args, ...props)(target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @function afterCreate
 *
 * @category Decorators
 */
export function afterCreate(
  handler: AfterOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    after(DBOperations.CREATE, handler, args, ...props)(target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.READ}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @function afterRead
 *
 * @category Decorators
 */
export function afterRead(
  handler: AfterOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    after(DBOperations.READ, handler, args, ...props)(target, propertyKey);
  };
}
/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @function afterDelete
 *
 * @category Decorators
 */
export function afterDelete(
  handler: AfterOperationHandler<any>,
  args: any[],
  ...props: string[]
) {
  return (target: any, propertyKey: string) => {
    after(DBOperations.DELETE, handler, args, ...props)(target, propertyKey);
  };
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} operation One of {@link DBOperations}
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @function after
 *
 * @category Decorators
 */
export function after(
  operation: OperationKeys[] | DBOperations = DBOperations.ALL,
  handler: AfterOperationHandler<any>,
  args: any[] = [],
  ...props: string[]
) {
  return Operations.genDecorator(
    OperationKeys.AFTER,
    operation as OperationKeys[],
    handler,
    args,
    ...props,
  );
}
