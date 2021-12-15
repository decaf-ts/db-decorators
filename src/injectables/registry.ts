import {CriticalError} from "../errors";

/**
 * Basic Builder Registry Interface
 * @typedef T
 * @interface BuilderRegistry
 *
 * @memberOf db-decorators.injectables
 */
export interface BuilderRegistry<T>{
    /**
     *
     * @param {string} name
     * @param {args[]} args
     */
    get(name: string, ...args: any[]): {new(): T} | undefined;

    /**
     *
     * @param {string} name
     * @param {any} constructor
     * @param {any[]} args
     */
    register(name: string, constructor: any, ...args: any[]): void;

    /**
     *
     * @param {{}} obj
     * @param {any[]} args
     */
    build(obj: {[indexer: string]: any}, ...args: any[]): T;
}

/**
 * @typedef Injectable
 *
 * @memberOf db-decorators.injectables
 */
export type Injectable<T> = {new: T} | T

/**
 * @interface InjectableRegistry
 *
 * @memberOf db-decorators.injectables
 */
export interface InjectablesRegistry {
    /**
     *
     * @param {string} name
     * @param {any[]} args
     * @return {Injectable | undefined}
     *
     * @memberOf InjectablesRegistry
     */
    get<T>(name: string, ...args: any[]): Injectable<T> | undefined;

    /**
     *
     * @param {Injectable} constructor
     * @param {any[]} args
     *
     * @memberOf InjectablesRegistry
     */
    register<T>(constructor: Injectable<T>, ...args: any[]): void;

    /**
     *
     * @param {{}} obj
     * @param {any[]} args
     * @return T
     */
    build<T>(obj: {[indexer: string]: any}, ...args: any[]): T;
}

/**
 * @class InjectableRegistryImp
 * @implements InjectablesRegistry
 *
 * @memberOf db-decorators.injectables
 */
export class InjectableRegistryImp implements InjectablesRegistry {
    private cache: {[indexer: string] : any} = {};

    /**
     * @inheritDoc
     */
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
    /**
     * @inheritDoc
     */
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
    /**
     * @inheritDoc
     */
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
 * @memberOf db-decorators.injectables
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
 * @memberOf db-decorators.injectables
 */
export function setInjectablesRegistry(operationsRegistry: InjectablesRegistry){
    actingInjectablesRegistry = operationsRegistry;
}