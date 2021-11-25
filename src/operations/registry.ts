import {OperationHandler} from "./types";
import {IRegistry} from "@tvenceslau/decorator-validation/lib/utils/registry";

export class OperationsRegistry implements IRegistry<OperationHandler<any>> {
    private cache: { [indexer: string]: any } = {};

    get<OperationHandler>(targetName: string, propKey: string, operation: string): OperationHandler | undefined {
        try{
            return this.cache[targetName][propKey][operation];
        } catch (e){
            return undefined;
        }
    }

    register<OperationHandler>(handler: OperationHandler, operation: string, target: { [indexer: string]: any }, propKey: string | symbol): void {
        const name = target.constructor.name;
        if (!this.cache[name])
            this.cache[name] = {};
        if (!this.cache[name][propKey])
            this.cache[name][propKey] = {};
        if (this.cache[name][propKey][operation])
            return;
        this.cache[name][propKey][operation] = handler;
    }
}

let actingOperationsRegistry: IRegistry<OperationHandler<any>>;

/**
 * Returns the current {@link OperationsRegistry}
 * @function getOperationsRegistry
 * @return IRegistry<OperationHandler<any>>, defaults to {@link OperationsRegistry}
 * @memberOf operations
 */
export function getOperationsRegistry(): IRegistry<OperationHandler<any>> {
    if (!actingOperationsRegistry)
        actingOperationsRegistry = new OperationsRegistry();
    return actingOperationsRegistry;
}

/**
 * Returns the current OperationsRegistry
 * @function getOperationsRegistry
 * @prop {IRegistry<OperationHandler<any>>} operationsRegistry the new implementation of Registry
 * @memberOf operations
 */
export function setOperationsRegistry(operationsRegistry: IRegistry<OperationHandler<any>>){
   actingOperationsRegistry = operationsRegistry;
}