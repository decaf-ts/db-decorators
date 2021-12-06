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
    private cache: {[indexer: string]: {[indexer: string] : any}} = {};

    get<T>(category: string, name: string, ...args: any[]): T | undefined {
        try{
            const innerCache = this.cache[category][name];
            const buildDef = {category: category, name: name};
            if (!innerCache.isSingleton && !innerCache.instance)
                return this.build<T>(buildDef, ...args);
            return innerCache.instance || this.build<T>(buildDef, ...args);
        } catch (e) {
            return undefined;
        }
    }

    register<T>(obj: Injectable<T>, category: string, isSingleton: boolean = true, force: boolean = false): void {
        // @ts-ignore
        const constructor = !obj.name && obj.constructor;
        if (!category || (typeof obj !== 'function' && !constructor))
            throw new CriticalError(`Injectable registering failed. Missing Class name or constructor`);
        if (!this.cache[category])
            this.cache[category] = {};

        // @ts-ignore
        const name = constructor && constructor.name && constructor.name !== "Function" ? constructor.name : obj.name;

        if (!this.cache[category][name] || force)
            this.cache[category][name] = {
                instance: constructor ? obj : undefined,
                constructor: !constructor ? obj : undefined,
                singleton: isSingleton
            };
    }

    build<T>(defs: {category: string, name: string}, ...args: any[]): T {
        try {
            const {constructor, singleton} = this.cache[defs.category][defs.name] ;
            const instance = new constructor(...args);
            this.cache[defs.category][defs.name] = {
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