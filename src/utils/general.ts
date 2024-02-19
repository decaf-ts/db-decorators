import {getHashingFunction, getPropertyDecorators, hashCode, ModelKeys} from "@glass-project1/decorator-validation";
import {all, Callback, Err} from "@glass-project1/logging";

/**
 * @summary Util method to change a method of an object prefixing it with another
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function anme cannot be extracted, pass it here
 *
 * @function prefixMethod
 *
 * @memberOf module:db-decorators.Repository
 */
export function prefixMethod(obj: any, after: Function, prefix: Function, afterName?: string){
    function wrapper(this: any, ...args: any[]){
        const results = prefix.call(this, ...args);
        return after.call(this, ...results);
    }
    obj[afterName ? afterName : after.name] = wrapper.bind(obj);
}

/**
 * @summary Util method to change a method of an object suffixing it with another
 * @param {any} obj The Base Object
 * @param {Function} before The original method
 * @param {Function} suffix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [beforeName] When the after function anme cannot be extracted, pass it here
 *
 * @function suffixMethod
 *
 * @memberOf module:db-decorators.Repository
 */
export function suffixMethod(obj: any, before: Function, suffix: Function, beforeName?: string){
    function wrapper(this: any, ...args: any[]){
        const results = before.call(this, ...args);
        return suffix.call(this, ...results);
    }
    obj[beforeName ? beforeName : before.name] = wrapper.bind(obj);
}

/**
 * @summary Util method to wrap a method of an object with additional logic
 *
 * @param {any} obj The Base Object
 * @param {Function} before the method to be prefixed
 * @param {Function} method the method to be wrapped
 * @param {Function} after The method to be suffixed
 * @param {string} [methodName] When the after function anme cannot be extracted, pass it here
 *
 * @function wrapMethod
 *
 * @memberOf module:db-decorators.Repository
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
 * @summary The Async version of {@link prefixMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function name cannot be extracted, pass it here
 *
 * @function prefixMethodAsync
 *
 * @memberOf module:db-decorators.Repository
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
 * @summary The Async version of {@link suffixMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} before The original method
 * @param {Function} suffix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [beforeName] When the after function name cannot be extracted, pass it here
 *
 * @function suffixMethodAsync
 *
 * @memberOf module:db-decorators.Repository
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
 * @summary The Async version of {@link wrapMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} before the method to be prefixed
 * @param {Function} method the method to be wrapped
 * @param {Function} after The method to be suffixed
 * @param {string} [methodName] When the after function name cannot be extracted, pass it here
 *
 * @function wrapMethodAsync
 *
 * @memberOf module:db-decorators.Repository
 */
export function wrapMethodAsync(obj: any, before: Function, method: Function, after: Function, methodName?: string){
    function wrapper(this: any, ...args: any[]){
        const callback: Callback = args.pop();
        const self = this
        return before.call(self, ...args, (err: Err, ...transformedArgs: any[]) => {
            if (err)
                return callback(err);
            method.call(self, ...transformedArgs, (err: Err, ...results: any[]) => {
                if (err)
                    return callback(err);
                after.call(self, ...results, (err: Err, ...otherResults: any[]) => {
                    if (err)
                        return callback(err);
                    callback(undefined, ...otherResults);
                });
            });
        });
    }

    obj[methodName ? methodName : method.name] = wrapper;
}

/**
 * @summary Retrieves all properties of an object
 * @description
 *  - and of all its prototypes if {@param climbTree} until it reaches {@param stopAt} (or ends the prototype chain)
 *
 * @param obj
 * @param {boolean} [climbTree] default to true
 * @param {string} [stopAt] defaults to 'Object'
 *
 * @function getAllProperties
 *
 * @memberOf module:db-decorators.Model
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
 * @summary gets the prop type from the decorator
 * @param {any} model
 * @param {string | symbol} propKey
 * @return {string | undefined}
 *
 * @function geTypeFromDecorators
 *
 * @memberOf module:db-decorators.Repository
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

/**
 * @summary Generates an Id for an object by:
 * @description
 *  1 - trying to get its `name` property;
 *  2 - if it does not exist (or is `Function`) return the hash of the string representation of the object (using the hashing unction via {@link getHashingFunction})
 * @param {any} handler
 * @memberOf module:db-decorators.Repository
 */
export function getHandlerKey(handler: any){
    let handlerName = (handler as {[key: string]: any})["name"];

    if (!handlerName || handlerName === "Function"){
        all.call(getHandlerKey, "No handler name found. generating");
        handlerName = hashCode((handler as any).toString());
    }

    return handlerName;
}