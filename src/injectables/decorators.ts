import {getInjectablesRegistry} from "./registry";
import {InjectablesKeys} from "./constants";
import {CriticalError} from "../errors";
import {debug} from "../logging";

const getInjectKey = (key: string) => InjectablesKeys.REFLECT + key;

/**
 * Defines a class as a injectable
 *
 * @prop {boolean} [singleton] defaults to true. if the behaviour is meant to be singleton
 * @prop {boolean} [force] defines if the injectable should override the already existing instance (if any). (only meant for extending decorators
 * @prop {any[]} [props] additional properties to pass for the decorator metadata. (only meant for 'extending' classes)
 * @decorator injectable
 * @namespace Decorators
 * @memberOf Model
 */
export const injectable = (category: string, singleton: boolean = true, force: boolean = false, ...props: any[]) => (original: Function) => {

    const registry = getInjectablesRegistry();
    const instance = registry.get(category, original.name);
    if (!instance){
        registry.register(original, category, singleton);
        debug(`Constructor for ${original.name} registered as an Injectable under '${category}.${original.name}'`);
    }

    // the new constructor behaviour
    const newConstructor : any = function (...args: any[]) {
        const injectable: any = registry.get<any>(category, original.name, ...args);
        if (!injectable)
            throw new CriticalError(`Could not find Injectable in Registry`);

        const metadata = Object.assign({}, {
            class: original.name
        }, props || {});

        Reflect.defineMetadata(
            getInjectKey(category),
            metadata,
            injectable.constructor
        );

        return injectable;
    }

    // copy prototype so instanceof operator still works
    newConstructor.prototype = original.prototype;
    // Sets the proper constructor name for type verification
    Object.defineProperty(newConstructor, "name", {
        writable: false,
        enumerable: true,
        configurable: false,
        value: original.prototype.constructor.name
    });
    // return new constructor (will override original)
    return newConstructor;
}