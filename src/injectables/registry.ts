import {CriticalError} from "@glass-project1/logging";
import {Constructor} from "@glass-project1/decorator-validation";

/**
 * @summary Basic Builder Registry Interface
 * @interface BuilderRegistry
 * @category Model
 */
export interface BuilderRegistry<T>{
    /**
     * @summary retrieves a builder
     * @param {string} name
     * @param {args[]} args
     * @method
     */
    get(name: string, ...args: any[]): {new(): T} | undefined;

    /**
     * @summary register a constructor
     * @param {string} name
     * @param {any} constructor
     * @param {any[]} args
     * @method
     */
    register(name: string, constructor: any, ...args: any[]): void;

    /**
     * @summary builds an object using a registered constructor
     * @param {Record<string, any>} obj
     * @param {any[]} args
     * @method
     */
    build(obj: Record<string, any>, ...args: any[]): T;
}

/**
 * @summary defines an Injectable type
 * @memberOf module:db-decorators.Injectables
 */
export type Injectable<T> = Constructor<T> | T

/**
 * @summary Interface for an injectable registry
 * @interface InjectableRegistry
 * @category Injectables
 */
export interface InjectablesRegistry {
    /**
     * @summary retrieves an {@link Injectable}
     * @param {string} name
     * @param {any[]} args
     * @return {Injectable | undefined}
     *
     * @method
     */
    get<T>(name: string, ...args: any[]): Injectable<T> | undefined;

    /**
     * @summary registers an injectable constructor
     * @param {Injectable} constructor
     * @param {any[]} args
     *
     * @method
     */
    register<T>(constructor: Injectable<T>, ...args: any[]): void;

    /**
     * @summary Instantiates an Injectable
     * @param {Record<string, any>} obj
     * @param {any[]} args
     * @return T
     *
     * @method
     */
    build<T>(obj: Record<string, any>, ...args: any[]): T;
}

/**
 * @summary Holds the vairous {@link Injectable}s
 * @class InjectableRegistryImp
 * @implements InjectablesRegistry
 *
 * @category Injectables
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
    register<T>(obj: Injectable<T>, category: string | undefined = undefined, isSingleton: boolean = true, force: boolean = false): void {

        const castObj: Record<string, any> = obj as Record<string, any>;

        const constructor = !castObj.name && castObj.constructor;
        if ((typeof castObj !== 'function' && !constructor))
            throw new CriticalError(`Injectable registering failed. Missing Class name or constructor`);

        const name = category || (constructor && constructor.name && constructor.name !== "Function" ? (constructor as {[indexer: string]: any}).name : castObj.name);

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
        } catch (e: any) {
            throw new CriticalError(e);
        }
    }
}

let actingInjectablesRegistry: InjectablesRegistry

/**
 * @summary Returns the current {@link InjectableRegistryImp}
 * @function getInjectablesRegistry
 * @return InjectablesRegistry, defaults to {@link InjectableRegistryImp}
 * @memberOf module:db-decorators.Injectables
 */
export function getInjectablesRegistry(): InjectablesRegistry {
    if (!actingInjectablesRegistry)
        actingInjectablesRegistry = new InjectableRegistryImp();
    return actingInjectablesRegistry;
}

/**
 * @summary Returns the current OperationsRegistry
 * @param {InjectablesRegistry} operationsRegistry the new implementation of Registry
 * @function getOperationsRegistry
 * @memberOf module:db-decorators.Injectables
 */
export function setInjectablesRegistry(operationsRegistry: InjectablesRegistry){
    actingInjectablesRegistry = operationsRegistry;
}