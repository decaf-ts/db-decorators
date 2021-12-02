import {
    constructFromObject as constrObj,
    construct as superConstruct, getPropertyDecorators
} from "@tvenceslau/decorator-validation/lib";
export {getClassDecorators, stringFormat, formatDate} from "@tvenceslau/decorator-validation/lib";

import DBModel from "../model/DBModel";
import {AsyncRepository, Callback, Err, ModelCallback, Repository} from "../repository";
import {OperationHandlerAsync, OperationKeys} from "../operations";
import {getOperationsRegistry} from "../operations/registry";
import {errorCallback, LoggedError} from "../errors";

/**
 * Helper Function to override constructors
 * @param {Function} constructor
 * @param {any[]} args
 * @return {T} the new instance
 */
export function construct<T extends DBModel>(constructor: any, ...args: any[]) {
    return superConstruct<T>(constructor, ...args);
}

export function constructFromObject<T extends DBModel>(self: T, obj?: T | {}){
    return constrObj<T>(self, obj);
}

/**
 * Util method to change a method of an object prefixing it with another
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function anme cannot be extracted, pass it here
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
 */
export function suffixMethod(obj: any, before: Function, suffix: Function, beforeName?: string){
    function wrapper(this: any, ...args: any[]){
        const results = before.call(this, ...args);
        return suffix.call(this, ...results);
    }
    obj[beforeName ? beforeName : before.name] = wrapper.bind(obj);
}

/**
 * The Async version of {@link prefixMethod}
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function name cannot be extracted, pass it here
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
 * @param {any} obj The Base Object
 * @param {Function} before The original method
 * @param {Function} suffix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [beforeName] When the after function name cannot be extracted, pass it here
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

export const getAllPropertyDecorators = function<T extends DBModel>(model: T , ...prefixes: string[]): {[indexer: string]: any[]} | undefined {
    if (!prefixes || !prefixes.length)
        return;

    const pushOrCreate = function(accum: {[indexer: string]: {[indexer: string]: any}}, key: string, decorators: any[]){
        if (!decorators)
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