import "reflect-metadata";
import {OperationKeys, DBOperations} from "./constants";
import {hashCode} from "@tvenceslau/decorator-validation/lib";
import {getOperationsRegistry} from "./registry";
import {AfterOperationHandler, OnOperationHandler} from "./types";

/**
 * @namespace db-decorators.operations.decorators
 * @memberOf db-decorators.operations
 */

/**
 *
 * @param {string} str
 * @function getOperationKey
 * @me\ db-decorators.operations.decorators
 */
const getOperationKey = (str: string) => OperationKeys.REFLECT + str;

/**
 * Defines a behaviour to set on the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onCreateUpdate
 *
 * @category Decorators
 */
export const onCreateUpdate = (handler: OnOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.CREATE_UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onUpdate
 *
 * @category Decorators
 */
export const onUpdate = (handler: OnOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.CREATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onCreate
 *
 * @category Decorators
 */
export const onCreate = (handler: OnOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.CREATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.READ}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onRead
 *
 * @category Decorators
 */
export const onRead = (handler: OnOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.READ, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onDelete
 *
 * @category Decorators
 */
export const onDelete = (handler: OnOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.DELETE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {string[]} operation One of {@link DBOperations}
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @decorator on
 *
 * @category Decorators
 */
export const on = (operation: string[] = DBOperations.ALL, handler: OnOperationHandler<any>, args: any[] = [], ...props: string[]) => (target: any, propertyKey: string) => {
    operation.forEach(op => {
        op = OperationKeys.ON + op;
        Reflect.defineMetadata(
            getOperationKey(op),
            {
                operation: op,
                handler: hashCode(handler.toString()),
                args: args,
                props: props
            },
            target,
            propertyKey
        );
        getOperationsRegistry().register(handler, op, target, propertyKey)
    });
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterCreateUpdate
 *
 * @category Decorators
 */
export const afterCreateUpdate = (handler: AfterOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.CREATE_UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterUpdate
 *
 * @category Decorators
 */
export const afterUpdate = (handler: AfterOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.CREATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterCreate
 *
 * @category Decorators
 */
export const afterCreate = (handler: AfterOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.CREATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.READ}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterRead
 *
 * @category Decorators
 */
export const afterRead = (handler: AfterOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.READ, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterDelete
 *
 * @category Decorators
 */
export const afterDelete = (handler: AfterOperationHandler<any>, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.DELETE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {string[]} operation One of {@link DBOperations}
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @decorator after
 *
 * @category Decorators
 */
export const after = (operation: string[] = DBOperations.ALL, handler: AfterOperationHandler<any>, args: any[] = [], ...props: string[]) => (target: any, propertyKey: string) => {
    operation.forEach(op => {
        op = OperationKeys.AFTER + op;
        Reflect.defineMetadata(
            getOperationKey(op),
            {
                operation: op,
                handler: hashCode(handler.toString()),
                args: args,
                props: props
            },
            target,
            propertyKey
        );
        getOperationsRegistry().register(handler, op, target, propertyKey);
    });
}