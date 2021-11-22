/**
 * Defines a class as a injectable
 *
 * @prop {boolean} [singleton] defaults to true. if the behaviour is meant to be singleton
 * @decorator injectable
 * @namespace Decorators
 * @memberOf Model
 */
import {construct} from "../utils";
import {IRegistry} from "./registry";

class InjectableRegistryImp implements IRegistry<{new(): any}>{
    get<T>(key: any, ...args: any[]): T | undefined {
        return undefined;
    }

    register<T>(obj: T, ...args: any[]): void {
    }

}

let actingInjectablesRegistry: IRegistry<{new(): any}>;

/**
 * Returns the current {@link InjectableRegistryImp}
 * @function getInjectablesRegistry
 * @return IRegistry, defaults to {@link InjectableRegistryImp}
 * @memberOf operations
 */
export function getInjectablesRegistry(): IRegistry<{new(): any}> {
    if (!actingInjectablesRegistry)
        actingInjectablesRegistry = new InjectableRegistryImp();
    return actingInjectablesRegistry;
}

/**
 * Returns the current OperationsRegistry
 * @function getOperationsRegistry
 * @prop {IRegistry} operationsRegistry the new implementation of Registry
 * @memberOf operations
 */
export function setInjectablesRegistry(operationsRegistry: IRegistry<{new(): any}>){
    actingInjectablesRegistry = operationsRegistry;
}

export const injectable = (singleton: boolean = true) => (original: Function) => {




    // the new constructor behaviour
    const newConstructor : any = function (...args: any[]) {
        let instance;
        if (singleton){
            instance = getInjectablesRegistry().get(original.name);
            if (!instance){
                instance = construct(original, ...args);
                getInjectablesRegistry().register(original.name, instance);
            }
        } else {
            instance = construct(original, ...args);
        }

        return instance;
    }

    // copy prototype so instanceof operator still works
    newConstructor.prototype = original.prototype;

    // return new constructor (will override original)
    return newConstructor;
}