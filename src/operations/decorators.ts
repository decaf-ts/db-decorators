import {
  AfterOperationHandler,
  OnOperationHandler,
  OperationHandler,
  OperationMetadata,
} from "./types";
import { DBOperations, OperationKeys } from "./constants";
import { Operations } from "./Operations";
import {
  apply,
  CustomDecorator,
  metadata,
} from "@decaf-ts/decorator-validation";

function handle(op: OperationKeys, handler: OperationHandler<any>) {
  return (target: any, propertyKey: string) => {
    Operations.register(handler, op, target, propertyKey);
  };
}

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
  return on(DBOperations.CREATE_UPDATE, handler, args, ...props);
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
  return on(DBOperations.UPDATE, handler, args, ...props);
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
  return on(DBOperations.CREATE, handler, args, ...props);
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
  return on(DBOperations.READ, handler, args, ...props);
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
  return on(DBOperations.DELETE, handler, args, ...props);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} op One of {@link DBOperations}
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
  op: OperationKeys[] = DBOperations.ALL,
  handler: OnOperationHandler<any, any>,
  args: any[] = [],
  ...props: string[]
) {
  return operation(OperationKeys.ON, op, handler, args, ...props);
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
  return after(DBOperations.CREATE_UPDATE, handler, args, ...props);
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
  return after(DBOperations.UPDATE, handler, args, ...props);
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
  return after(DBOperations.CREATE, handler, args, ...props);
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
  return after(DBOperations.READ, handler, args, ...props);
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
  return after(DBOperations.DELETE, handler, args, ...props);
}

export function operation(
  baseOp: OperationKeys.ON | OperationKeys.AFTER,
  operation: OperationKeys[] = DBOperations.ALL,
  handler: OperationHandler<any, any>,
  args: any[] = [],
  ...props: string[]
) {
  function reduceFunc(
    op: OperationKeys,
    accum: CustomDecorator<any>[],
  ): CustomDecorator<any>[] {
    const operat = `${baseOp.toString()}${op.toString()}`;

    const data: OperationMetadata = {
      operation: operat as OperationKeys,
      handler: Operations.getHandlerName(handler),
      args: args,
      props: props,
    };
    accum.push(
      metadata(Operations.genKey(operat), data) as CustomDecorator<any>,
      handle(operat as OperationKeys, handler) as CustomDecorator<any>,
    );
    return accum;
  }
  // @ts-expect-error its not recognizing the right api for reduce
  const ops = operation.reduce(reduceFunc, []) as CustomDecorator<any>[];

  return apply(...ops);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {OperationKeys[] | DBOperations} op One of {@link DBOperations}
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
  op: OperationKeys[] = DBOperations.ALL,
  handler: AfterOperationHandler<any>,
  args: any[] = [],
  ...props: string[]
) {
  return operation(OperationKeys.AFTER, op, handler, args, ...props);
}
