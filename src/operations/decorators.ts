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
 * @decorator onDelete
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
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterCreateUpdate
 * @namespace decorators
 * @memberOf operations
 */
export const afterCreateUpdate = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.CREATE_UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.UPDATE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterUpdate
 * @namespace decorators
 * @memberOf operations
 */
export const afterUpdate = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.UPDATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.CREATE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterCreate
 * @namespace decorators
 * @memberOf operations
 */
export const afterCreate = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.CREATE, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.READ}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterRead
 * @namespace decorators
 * @memberOf operations
 */
export const afterRead = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.READ, handler, args, ...props)(target, propertyKey);
}

/**
 * Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {OperationHandler} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 * @param {string[]} [props] property keys that will be passed in order after the args
 *
 * @see after
 *
 * @decorator afterDelete
 * @namespace decorators
 * @memberOf operations
 */
export const afterDelete = (handler: OperationHandler, args: any[], ...props: string[]) => (target: any, propertyKey: string) => {
    after(DBOperations.DELETE, handler, args, ...props)(target, propertyKey);
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
 * @decorator after
 * @namespace decorators
 * @memberOf operations
 */
export const after = (operation: string[] = DBOperations.ALL, handler: OperationHandler, args: any[] = [], ...props: string[]) => (target: any, propertyKey: string) => {
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