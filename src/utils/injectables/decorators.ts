/**
 * Defines a class as a injectable
 *
 * @prop {boolean} [singleton] defaults to true. if the behaviour is meant to be singleton
 * @decorator injectable
 * @namespace Decorators
 * @memberOf Model
 */
import {construct} from "../utils";
import {getInjectablesRegistry} from "./registry";

export const injectable = (category: string, singleton: boolean = true) => (original: Function) => {

    // the new constructor behaviour
    const newConstructor : any = function (...args: any[]) {
        let instance;
        if (singleton){
            instance = getInjectablesRegistry().get(category, original.name);
            if (!instance){
                instance = construct(original, ...args);
                getInjectablesRegistry().register(category, instance);
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