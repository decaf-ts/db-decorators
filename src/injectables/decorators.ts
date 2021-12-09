import {getInjectablesRegistry} from "./registry";
import {InjectablesKeys} from "./constants";
import {CriticalError} from "../errors";
import {debug} from "../logging";
import {getTypeFromDecorator} from "../utils";
import {DBKeys} from "../model";

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
export const injectable = (singleton: boolean = true, force: boolean = false, ...props: any[]) => (original: Function) => {

    const registry = getInjectablesRegistry();
    const instance = registry.get(original.name);
    if (!instance){
        registry.register(original, singleton);
        debug(`Constructor for ${original.name} registered as an Injectable under '${original.name}'`);
    }

    // the new constructor behaviour
    const newConstructor : any = function (...args: any[]) {
        const injectable: any = registry.get<any>(original.name, ...args);
        if (!injectable)
            throw new CriticalError(`Could not find Injectable in Registry`);

        const metadata = Object.assign({}, {
            class: original.name
        }, props || {});

        Reflect.defineMetadata(
            getInjectKey(InjectablesKeys.INJECTABLE),
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

/**
 * Allows for the injection of an {@link injectable} decorated dependency
 * the property must be typed for the requested dependency.
 *
 * Only concrete classes. No generics are supported
 *
 * @decorator
 */
export const inject = () => (target: any, propertyKey: string) => {

    const values = new WeakMap();

    const name: string | undefined = getTypeFromDecorator(target, propertyKey);
    if (!name)
        throw new CriticalError(`Could not get Type from decorator`);

    Reflect.defineMetadata(
        getInjectKey(InjectablesKeys.INJECT),
        {
            injectable: name
        },
        target,
        propertyKey
    );

    Object.defineProperty(target, propertyKey, {
        configurable: true,
        get(this: any){
            const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey) as PropertyDescriptor;
            if (descriptor.configurable){
                Object.defineProperty(this, propertyKey, {
                    enumerable: true,
                    configurable: false,
                    get(this: any){
                        let obj = values.get(this);
                        if (!obj){
                            obj = getInjectablesRegistry().get(name);
                            if (!obj)
                                throw new CriticalError(`Could not get Injectable ${name} to inject in ${target.constructor ? target.constructor.name: target.name}'s ${propertyKey}`)
                            values.set(this, obj);
                        }
                        return obj;
                    }
                });
                return this[propertyKey];
            }
        }
    });
}