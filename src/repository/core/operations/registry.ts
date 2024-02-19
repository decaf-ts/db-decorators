import {IRegistry} from "@glass-project1/decorator-validation";
import {OperationHandler} from "./types";
import {getHandlerKey} from "../../../utils";

/**
 * @summary holds the operations
 *
 * @class OperationsRegistry
 * @implements IRegistry<OperationHandler<any>>
 *
 * @see OperationHandler
 *
 * @category Operations
 */
export class OperationsRegistry {
    private cache: { [indexer: string]: any } = {};

    /**
     * @summary retrieves an operation
     * @param {string | {}} target
     * @param {string} propKey
     * @param {string} operation
     * @param {OperationHandler[]} [accum] used internally for caching previous
     * @return {OperationHandler[] | undefined}
     */
    get<OperationHandler>(target: string | {[indexer: string]: any}, propKey: string, operation: string, accum?: OperationHandler[]): OperationHandler[] | undefined {
        accum = accum || [];
        let name
        try{
            name = typeof target === "string" ? target : target.constructor.name;
            accum.unshift(...(Object.values(this.cache[name][propKey][operation] as OperationHandler[] || [])));
        } catch (e) {
            if (typeof target === 'string' || target === Object.prototype || Object.getPrototypeOf(target) === Object.prototype)
                return accum;
        }

        let proto = Object.getPrototypeOf(target);
        if (proto.constructor.name === name)
            proto = Object.getPrototypeOf(proto)

        return this.get(proto, propKey, operation, accum);
    }

    /**
     * @summary registers an operation
     * @param {OperationHandler} handler
     * @param {string} operation
     * @param {{}} target
     * @param {string | symbol} propKey
     * @param {}
     */
    register<OperationHandler>(handler: OperationHandler, operation: string, target: { [indexer: string]: any }, propKey: string | symbol): void {
        const name = target.constructor.name;
        let handlerName = getHandlerKey(handler);

        if (!this.cache[name])
            this.cache[name] = {};
        if (!this.cache[name][propKey])
            this.cache[name][propKey] = {};
        if (!this.cache[name][propKey][operation])
            this.cache[name][propKey][operation] = {};
        if (this.cache[name][propKey][operation][handlerName])
            return;
        this.cache[name][propKey][operation][handlerName] = handler;
    }
}

let actingOperationsRegistry: OperationsRegistry;

/**
 * @summary Returns the current {@link OperationsRegistry}
 * @function getOperationsRegistry
 * @return IRegistry<OperationHandler<any>>, defaults to {@link OperationsRegistry}
 * @memberOf module:db-decorators.Operations
 */
export function getOperationsRegistry(): OperationsRegistry {
    if (!actingOperationsRegistry)
        actingOperationsRegistry = new OperationsRegistry();
    return actingOperationsRegistry;
}

/**
 * @summary Returns the current OperationsRegistry
 * @function getOperationsRegistry
 * @prop {IRegistry<OperationHandler<any>>} operationsRegistry the new implementation of Registry
 * @memberOf module:db-decorators.Decorators.Operations
 */
export function setOperationsRegistry(operationsRegistry: OperationsRegistry){
   actingOperationsRegistry = operationsRegistry;
}