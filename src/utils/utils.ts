import {
    getPropertyDecorators, ModelKeys
} from "@tvenceslau/decorator-validation/lib";

import DBModel from "../model/DBModel";
import {AsyncRepository, Callback, Err, ModelCallback, Repository} from "../repository";
import {OperationHandlerAsync, OperationKeys} from "../operations";
import {getOperationsRegistry} from "../operations/registry";
import {errorCallback, LoggedError} from "../errors";

/**
 * Util method to change a method of an object prefixing it with another
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function anme cannot be extracted, pass it here
 *
 * @function prefixMethod
 *
 * @memberOf db-decorators.utils
 */
export function prefixMethod(obj: any, after: Function, prefix: Function, afterName?: string){
    function wrapper(this: any, ...args: any[]){
        const results = prefix.call(this, ...args);
        return after.call(this, ...results);
    }
    obj[afterName ? afterName : after.name] = wrapper.bind(obj);
}

/**
 * Util method to change a method of an object suffixing it with another
 * @param {any} obj The Base Object
 * @param {Function} before The original method
 * @param {Function} suffix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [beforeName] When the after function anme cannot be extracted, pass it here
 *
 * @function suffixMethod
 *
 * @memberOf db-decorators.utils
 */
export function suffixMethod(obj: any, before: Function, suffix: Function, beforeName?: string){
    function wrapper(this: any, ...args: any[]){
        const results = before.call(this, ...args);
        return suffix.call(this, ...results);
    }
    obj[beforeName ? beforeName : before.name] = wrapper.bind(obj);
}

/**
 * Util method to wrap a method of an object with additional logic
 *
 * @param {any} obj The Base Object
 * @param {Function} before the method to be prefixed
 * @param {Function} method the method to be wrapped
 * @param {Function} after The method to be suffixed
 * @param {string} [methodName] When the after function anme cannot be extracted, pass it here
 *
 * @function wrapMethod
 *
 * @memberOf db-decorators.utils
 */
export function wrapMethod(obj: any, before: Function, method: Function, after: Function, methodName?: string){
    function wrapper(this: any, ...args: any[]){
        const transformedArgs = before.call(obj, ...args);
        const results = method.call(obj, ...transformedArgs);
        return after.call(this, ...results);
    }
    obj[methodName ? methodName : before.name] = wrapper.bind(obj);
}

/**
 * The Async version of {@link prefixMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function name cannot be extracted, pass it here
 *
 * @function prefixMethodAsync
 *
 * @memberOf db-decorators.utils
 */
export function prefixMethodAsync(obj: any, after: Function, prefix: Function, afterName?: string){
    function wrapperPrefix(...args: any[]){
        const callback: Callback = args.pop();
        return prefix.call(obj, ...args, (err: Err, ...results: any[]) => {
            if (err)
                return callback(err);
            after.call(obj, ...results, callback);
        });
    }
    obj[afterName ? afterName : after.name] = wrapperPrefix;
}

/**
 * The Async version of {@link suffixMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} before The original method
 * @param {Function} suffix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [beforeName] When the after function name cannot be extracted, pass it here
 *
 * @function suffixMethodAsync
 *
 * @memberOf db-decorators.utils
 */
export function suffixMethodAsync(obj: any, before: Function, suffix: Function, beforeName?: string){
    function wrapperSuffix(this: any, ...args: any[]){
        const callback: Callback = args.pop();
        return before.call(this, ...args, (err: Err, ...results: any[]) => {
            if (err)
                return callback(err);
            suffix.call(this, ...results, callback);
        });
    }
    obj[beforeName ? beforeName : before.name] = wrapperSuffix.bind(obj);
}

/**
 * The Async version of {@link wrapMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} before the method to be prefixed
 * @param {Function} method the method to be wrapped
 * @param {Function} after The method to be suffixed
 * @param {string} [methodName] When the after function name cannot be extracted, pass it here
 *
 * @function wrapMethodAsync
 *
 * @memberOf db-decorators.utils
 */
export function wrapMethodAsync(obj: any, before: Function, method: Function, after: Function, methodName?: string){
    function wrapper(this: any, ...args: any[]){
        const callback: Callback = args.pop();
        return before.call(obj, ...args, (err: Err, ...transformedArgs: any[]) => {
            if (err)
                return callback(err);
            method.call(obj, ...transformedArgs, (err: Err, ...results: any[]) => {
                if (err)
                    return callback(err);
                after.call(obj, ...results, (err: Err, ...otherResults: any[]) => {
                    if (err)
                        return callback(err);
                    callback(undefined, ...otherResults);
                });
            });
        });
    }

    obj[methodName ? methodName : method.name] = wrapper.bind(obj);
}

/**
 * Retrieves the decorators for an object's properties prefixed by {@param prefixes}
 *
 * @param {T} model
 * @param {string[]} prefixes
 *
 * @function getAllPropertyDecorators
 *
 * @memberOf db-decorators.utils
 */
export const getAllPropertyDecorators = function<T extends DBModel>(model: T , ...prefixes: string[]): {[indexer: string]: any[]} | undefined {
    if (!prefixes || !prefixes.length)
        return;

    const pushOrCreate = function(accum: {[indexer: string]: {[indexer: string]: any}}, key: string, decorators: any[]){
        if (!decorators || !decorators.length)
            return;
        if (!accum[key])
            accum[key] = [];
        accum[key].push(...decorators);
    }

    return Object.keys(model).reduce((accum: {} | undefined, propKey) => {
        prefixes.forEach((p, index) => {
            const decorators: {prop: string | symbol, decorators: any[]} = getPropertyDecorators(p, model, propKey, index !== 0);
            if (!accum)
                accum = {};
            pushOrCreate(accum, propKey, decorators.decorators);
        });
        return accum;
    }, undefined);
}
/**
 * Specific for DB Decorators
 * @param {T} model
 * @param {string} operation CRUD {@link OperationKeys}
 * @param {string} [extraPrefix]
 *
 * @function getDbPropertyDecorators
 *
 * @memberOf db-decorators.utils
 */
export const getDbDecorators = function<T extends DBModel>(model: T, operation: string, extraPrefix?: string): {[indexer: string]: {[indexer: string]: any[]}} | undefined {
    const decorators = getAllPropertyDecorators(model, OperationKeys.REFLECT + (extraPrefix ? extraPrefix : ''));
    if (!decorators)
        return;
    return Object.keys(decorators).reduce((accum: {[indexer: string]: any} | undefined, decorator) => {
        const dec = decorators[decorator].filter(d => d.key === operation);
        if (dec && dec.length){
            if (!accum)
                accum = {};
            accum[decorator] = dec;
        }
        return accum;
    }, undefined);
}
/**
 * Calls the handlers for each db decorator
 *
 * @param {Repository<T>} repo
 * @param {T} model
 * @param {{}} decorators
 *
 * @function enforceDBPropertyDecorators
 *
 * @memberOf db-decorators.utils
 */
export const enforceDBDecorators = function<T extends DBModel>(repo: Repository<T>, model: T, decorators: {[indexer: string]: {[indexer:string]: any[]}}): T {
    Object.keys(decorators).forEach(prop => {
        // @ts-ignore
        const decs: any[] = decorators[prop];
        const handler: Function | undefined = getOperationsRegistry().get(model.constructor.name, prop, decs[0].key);
        if (!handler)
            throw new LoggedError(`Could not find registered handler for the operation ${prop}`);
        handler.call(repo, model, ...decs[0].props.args, ...decs[0].props.props);
    });

    return model;
}
/**
 *
 * @param {Repository<T>} repo
 * @param {T} model
 * @param {{}} decorators
 * @param {string} [keyPrefix] defaults to ''
 * @param {ModelCallback} callback
 *
 * @function enforceDBPropertyDecoratorsAsync
 *
 * @memberOf db-decorators.utils
 */
export const enforceDBDecoratorsAsync = function<T extends DBModel>(repo: AsyncRepository<T>, model: T, decorators: {[indexer: string]: {[indexer:string]: any[]}}, keyPrefix: string = "", callback: ModelCallback<T>){

    const propIterator = function(props: string[], callback: ModelCallback<T>){
        const prop = props.shift();
        if (!prop)
            return callback(undefined, model);
        // @ts-ignore
        const decs: any[] = decorators[prop];
        const handler: OperationHandlerAsync<T> | undefined = getOperationsRegistry().get(model.constructor.name, prop, keyPrefix + decs[0].key);
        if (!handler)
            return errorCallback(new Error(`Could not find registered handler for the operation ${prop}`), callback);
        handler.call(repo, model, ...decs[0].props.args, ...decs[0].props.props, (err: Err) => {
            if (err)
                return callback(err);
            propIterator(props, callback);
        });
    }

    propIterator(Object.keys(decorators), (err: Err, model?: T) => {
        if (err)
            return callback(err);
        callback(undefined, model);
    });
}

/**
 * Retrieves all properties of an object:
 *  - and of all its prototypes if {@param climbTree} until it reaches {@param stopAt} (or ends the prototype chain)
 *
 * @param obj
 * @param {boolean} [climbTree] default to true
 * @param {string} [stopAt] defaults to 'Object'
 *
 * @function getAllProperties
 *
 * @memberOf db-decorators.utils
 */
export function getAllProperties(obj: {}, climbTree = true, stopAt = 'Object'){
    const allProps: string[] = [];
    let curr: {} = obj

    const keepAtIt = function(){
        if (!climbTree)
            return;
        let prototype = Object.getPrototypeOf(curr);
        if (!prototype || prototype.constructor.name === stopAt)
            return;
        curr = prototype;
        return curr;
    }

    do{
        let props = Object.getOwnPropertyNames(curr)
        props.forEach(function(prop){
            if (allProps.indexOf(prop) === -1)
                allProps.push(prop)
        })
    } while(keepAtIt())
    return allProps
}

/**
 *
 * @param {any} model
 * @param {string | symbol} propKey
 * @return {string | undefined}
 *
 * @function geTypeFromDecorators
 *
 * @memberOf db-decorators.utils
 */
export function getTypeFromDecorator(model: any, propKey: string | symbol): string | undefined {
    const decorators: {prop: string | symbol, decorators: any[]} = getPropertyDecorators(ModelKeys.REFLECT, model, propKey, false);
    if (!decorators || !decorators.decorators)
        return;

    // TODO handle @type decorators. for now we stick with design:type
    const typeDecorator = decorators.decorators.shift();
    const name = typeDecorator.props ? typeDecorator.props.name : undefined;
    return name !== "Function" ? name : undefined;
}