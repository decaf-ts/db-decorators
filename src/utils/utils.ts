
import {constructFromObject as constrObj, construct as superConstruct} from "@tvenceslau/decorator-validation/lib";
export {getPropertyDecorators, getClassDecorators, stringFormat, formatDate} from "@tvenceslau/decorator-validation/lib";

import DBModel from "../model/DBModel";
import {Callback, Err} from "../repository";
import {getPropertyDecorators} from "./index";
import {DBKeys} from "../model";
import {OperationKeys} from "../operations";

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
 */
export function prefixMethod(obj: any, after: Function, prefix: Function){
    function wrapper(this: any, ...args: any[]){
        const results = prefix.call(this, ...args);
        return after.call(this, ...results);
    }
    obj[prefix.name] = wrapper.bind(obj);
}

/**
 * The Async version of {@link prefixMethod}
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 */
export function prefixMethodAsync(obj: any, after: Function, prefix: Function){
    function wrapper(this: any, ...args: any[]){
        const callback: Callback = args.pop();
        return prefix.call(this, ...args, (err: Err, ...results: any[]) => {
            if (err)
                return callback(err);
            after.call(this, ...results, callback);
        });
    }
    obj[prefix.name] = wrapper.bind(obj);
}

export const getAllPropertyDecorators = function<T extends DBModel>(model: T , ...prefixes: string[]): {[indexer: string]: {[indexer: string]: any[]}} | undefined {
    if (!prefixes || !prefixes.length)
        return;

    const pushOrCreate = function(accum: {[indexer: string]: {[indexer: string]: any}}, key: string, values: {prop: string | symbol, decorators: any[]}){
        if (!decorators)
            return;
        if (!accum[key])
            accum[key] = {};
        if (!accum[key][values.prop.toString()])
            accum[key][values.prop.toString()] = [];
        accum[key][values.prop.toString()].push(...values.decorators);
    }

    const decorators: {[indexer: string]: {[indexer: string]: any[]}} = Object.keys(model).reduce((accum, propKey) => {
        prefixes.forEach(p => {
            const decorators: {prop: string | symbol, decorators: any[]} = getPropertyDecorators(p, model, propKey);
            pushOrCreate(accum, propKey, decorators);
        });
        return accum;
    }, {});

    return decorators;
}

export const getDbDecorators = function<T extends DBModel>(model: T, operation: string): {[indexer: string]: {[indexer: string]: any[]}} | undefined {
    const decorators = getAllPropertyDecorators(model, DBKeys.REFLECT, OperationKeys.REFLECT);
    if (!decorators)
        return;
    return Object.keys(decorators).reduce((accum, decorator) => {
        return accum;
    }, {});
}

export const enforceDBDecorators = function<T extends DBModel>(model: T, decorators: {[indexer: string]: {[indexer:string]: any[]}}){

}