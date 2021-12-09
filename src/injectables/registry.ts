/**
 * Basic Builder Registry Interface
 * @typedef T
 * @interface BuilderRegistry<T>
 */
import {CriticalError} from "../errors";

export interface BuilderRegistry<T>{
    get(name: string, ...args: any[]): {new(): T} | undefined;
    register(name: string, constructor: any, ...args: any[]): void;
    build(obj: {[indexer: string]: any}, ...args: any[]): T;
}

export type Injectable<T> = {new: T} | T

export interface InjectablesRegistry {
    get<T>(name: string, ...args: any[]): Injectable<T> | undefined;
    register<T>(constructor: Injectable<T>, ...args: any[]): void;
    build<T>(obj: {[indexer: string]: any}, ...args: any[]): T;
}

export class InjectableRegistryImp implements InjectablesRegistry {
    private cache: {[indexer: string] : any} = {};

    get<T>(name: string, ...args: any[]): T | undefined {
        try{
            const innerCache = this.cache[name];
            const buildDef = {name: name};
            if (!innerCache.isSingleton && !innerCache.instance)
                return this.build<T>(buildDef, ...args);
            return innerCache.instance || this.build<T>(buildDef, ...args);
        } catch (e) {
            return undefined;
        }
    }

    register<T>(obj: Injectable<T>, isSingleton: boolean = true, force: boolean = false): void {
        // @ts-ignore
        const constructor = !obj.name && obj.constructor;
        if ((typeof obj !== 'function' && !constructor))
            throw new CriticalError(`Injectable registering failed. Missing Class name or constructor`);

        // @ts-ignore
        const name = constructor && constructor.name && constructor.name !== "Function" ? constructor.name : obj.name;

        if (!this.cache[name] || force)
            this.cache[name] = {
                instance: constructor ? obj : undefined,
                constructor: !constructor ? obj : undefined,
                singleton: isSingleton
            };
    }

    build<T>(defs: {name: string}, ...args: any[]): T {
        try {
            const {constructor, singleton} = this.cache[defs.name] ;
            const instance = new constructor(...args);
            this.cache[defs.name] = {
                instance: instance,
                constructor: constructor,
                singleton: singleton
            }
            return instance;
        } catch (e) {
            throw new CriticalError(e);
        }
    }
}

let actingInjectablesRegistry: InjectablesRegistry

/**
 * Returns the current {@link InjectableRegistryImp}
 * @function getInjectablesRegistry
 * @return InjectablesRegistry, defaults to {@link InjectableRegistryImp}
 * @memberOf injectables
 */
export function getInjectablesRegistry(): InjectablesRegistry {
    if (!actingInjectablesRegistry)
        actingInjectablesRegistry = new InjectableRegistryImp();
    return actingInjectablesRegistry;
}

/**
 * Returns the current OperationsRegistry
 * @function getOperationsRegistry
 * @prop {InjectablesRegistry} injectablesRegistry the new implementation of Registry
 * @memberOf injectables
 */
export function setInjectablesRegistry(operationsRegistry: InjectablesRegistry){
    actingInjectablesRegistry = operationsRegistry;
}