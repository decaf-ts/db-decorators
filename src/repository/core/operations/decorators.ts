import "reflect-metadata";
import {getOperationsRegistry} from "./registry";
import {OperationKeys, DBOperations} from "./constants";
import {AfterOperationHandler, OnOperationHandler} from "./types";
import {getHandlerKey} from "../../../utils";

/**
 * @summary get the Operation reflection key
 * @param {string} str
 * @function getOperationKey
 * @memberOf module:db-decorators.Operations
 */
const getOperationKey = (str: string) => OperationKeys.REFLECT + str;

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onCreateUpdate
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const onCreateUpdate = (handler: OnOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    on(DBOperations.CREATE_UPDATE, handler, ...args,)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.UPDATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onUpdate
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const onUpdate = (handler: OnOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    on(DBOperations.UPDATE, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.CREATE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onCreate
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const onCreate = (handler: OnOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    on(DBOperations.CREATE, handler, ...args,)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.READ}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onRead
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const onRead = (handler: OnOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    on(DBOperations.READ, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations.DELETE}
 *
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see on
 *
 * @function onDelete
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const onDelete = (handler: OnOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    on(DBOperations.DELETE, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {string[]} operation One of {@link DBOperations}
 * @param {OnOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @function on
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const on = (operation: string[] = DBOperations.ALL, handler: OnOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    const name = target.constructor.name;
    operation.forEach(op => {
        op = OperationKeys.ON + op;
        let metadata = Reflect.getMetadata(getOperationKey(op), target, propertyKey);
        if (!metadata)
            metadata = {
                operation: op,
                handlers: {}
            }

        const handlerKey = getHandlerKey(handler);

        if (!metadata.handlers[name] || !metadata.handlers[name][propertyKey] || !(handlerKey in metadata.handlers[name][propertyKey])) {
            metadata.handlers[name] = metadata.handlers[name] || {};
            metadata.handlers[name][propertyKey] = metadata.handlers[name][propertyKey] || {};
            metadata.handlers[name][propertyKey][handlerKey] = {
                args: args
            };

            Reflect.defineMetadata(
                getOperationKey(op),
                metadata,
                target,
                propertyKey
            );
        }

        getOperationsRegistry().register(handler, op, target, propertyKey)
    });
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE_UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterCreateUpdate
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const afterCreateUpdate = (handler: AfterOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    after(DBOperations.CREATE_UPDATE, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.UPDATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterUpdate
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const afterUpdate = (handler: AfterOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    after(DBOperations.UPDATE, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.CREATE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterCreate
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const afterCreate = (handler: AfterOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    after(DBOperations.CREATE, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.READ}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterRead
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const afterRead = (handler: AfterOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    after(DBOperations.READ, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set after the defined {@link DBOperations.DELETE}
 *
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @see after
 *
 * @function afterDelete
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const afterDelete = (handler: AfterOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    after(DBOperations.DELETE, handler, ...args)(target, propertyKey);
}

/**
 * @summary Defines a behaviour to set on the defined {@link DBOperations}
 *
 * @param {string[]} operation One of {@link DBOperations}
 * @param {AfterOperationHandler<any>} handler The method called upon the operation
 * @param {any[]} [args] Arguments that will be passed in order to the handler method
 *
 * @function after
 *
 * @memberOf module:db-decorators.Decorators.operations
 */
export const after = (operation: string[] = DBOperations.ALL, handler: AfterOperationHandler<any>, ...args: any[]) => (target: any, propertyKey: string) => {
    const name = target.constructor.name;
    operation.forEach(op => {
        op = OperationKeys.AFTER + op;
        let metadata = Reflect.getMetadata(getOperationKey(op), target, propertyKey);
        if (!metadata)
            metadata = {
                operation: op,
                handlers: {}
            }

        const handlerKey = getHandlerKey(handler);

        if (!metadata.handlers[name] || !metadata.handlers[name][propertyKey] || !(handlerKey in metadata.handlers[name][propertyKey])) {
            metadata.handlers[name] = metadata.handlers[name] || {};
            metadata.handlers[name][propertyKey] = metadata.handlers[name][propertyKey] || {};
            metadata.handlers[name][propertyKey][handlerKey] = {
                args: args
            };

            Reflect.defineMetadata(
                getOperationKey(op),
                metadata,
                target,
                propertyKey
            );
        }

        getOperationsRegistry().register(handler, op, target, propertyKey);
    });
}