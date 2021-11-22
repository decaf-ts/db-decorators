import "reflect-metadata";
import {OperationKeys, DBOperations} from "./constants";
import {OperationHandler} from "./types";
import {hashCode} from "@tvenceslau/decorator-validation/lib";
import {getOperationsRegistry} from "./registry";


const getOperationKey = (str: string) => OperationKeys.REFLECT + str;

/**
 * Defines a behaviour to set on the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onCreateUpdate
 * @namespace decorators
 * @memberOf operations
 */
export const onCreateUpdate = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.CREATE_UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.UPDATE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onUpdate
 * @namespace decorators
 * @memberOf operations
 */
export const onUpdate = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.CREATE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onCreate
 * @namespace decorators
 * @memberOf operations
 */
export const onCreate = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.CREATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.READ}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onRead
 * @namespace decorators
 * @memberOf operations
 */
export const onRead = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.READ, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see on
 *
 * @decorator onRead
 * @namespace decorators
 * @memberOf operations
 */
export const onDelete = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    on(DBOperations.DELETE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {string[]} operation One of {@link DBOperations}
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * ex: handler(...args, ...props.map(p => target[p]))
 *
 * @decorator on
 * @namespace decorators
 * @memberOf operations
 */
export const on = (operation: string[] = DBOperations.ALL, handler: OperationHandler, args: any[] = [], ...props: string[]) => (target: any, propertyKey: string) => {
    operation.forEach(op => {
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
    });
    operation.forEach(op => getOperationsRegistry().register(handler, op, target, propertyKey));
}