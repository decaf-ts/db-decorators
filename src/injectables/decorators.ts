import {CriticalError, debug, error, warn} from "@glass-project1/logging";
import {InjectablesKeys} from "./constants";
import {getTypeFromDecorator} from "../utils";
import {getInjectablesRegistry} from "./registry";

/**
 * @summary Return the reflection key for injectables
 *
 * @param {string} key
 * @function getInjectKey
 *
 * @memberOf module:db-decorators.Injectables
 */
const getInjectKey = (key: string) => InjectablesKeys.REFLECT + key;

/**
 * @summary Defines a class as an injectable
 *
 * @param {string} [category] defaults to the class Name. (Useful when minification occours and names are changed so we can no longer rely on the class name, or when we want to upcast the Object)
 * @param {boolean} [force] defines if the injectable should override the already existing instance (if any). (only meant for extending decorators
 * @param {any[]} [props] additional properties to pass for the decorator metadata. (only meant for 'extending' classes)
 *
 * @function injectable
 *
 * @memberOf module:db-decorators.Decorators.injectables
 */
export const injectable = (category: string  | undefined = undefined, force: boolean = false, ...props: any[]) => (original: any) => {
    const name = category || original.name;
    // the new constructor behaviour
    const newConstructor : any = function (...args: any[]) {
        const registry = getInjectablesRegistry();
        let inj: any = registry.get<any>(name, ...args);
        if (!inj){
            registry.register(original, name, true, force);
            debug.call(injectable, `Constructor for ${original.name} registered as an Injectable under '${name}'`);
            inj = registry.get<any>(name, ...args);
            if (!inj){
                warn.call(injectable, "Could not retrieve the {0} injectable from Registry", name)
                return undefined;
            }
        }

        const metadata = Object.assign({}, {
            class: name
        }, props || {});

        Reflect.defineMetadata(
            getInjectKey(InjectablesKeys.INJECTABLE),
            metadata,
            inj.constructor
        );

        return inj;
    }

    // copy prototype so instanceof operator still works
    newConstructor.prototype = original.prototype;
    // newConstructor.__proto__ = original.__proto__;
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
 * @summary function witch transforms a cached {@link injectable}
 *
 * @param {any} injectable
 * @param {any} obj the obj the injectable will be injected on
 *
 * @memberOf module:db-decorators.Injectables
 */
export type InstanceTransformer = (injectable: any, obj: any) => any;

/**
 * @summary Allows for the injection of an {@link injectable} decorated dependency
 * @description the property must be typed for the requested dependency.
 *
 * Only concrete classes. No generics are supported
 *
 * Injected properties should be described like so:
 * <pre>
 *     class ClassName {
 *         ...
 *
 *         @inject()
 *         propertyName!: InjectableClass;
 *
 *         ...
 *     }
 * </pre>
 *
 * where InjectableClass is the class you want to inject.
 * Notice the use of '!:' to ensure the transpiler the property will be set outside the constructor but will always be defined
 * For project where minification occours, you should use the category param to ensure the name is the same throughout
 *
 * @param {string} [category] defaults to the class Name. (Useful when minification occours and names are changed so we can no longer rely on the class name, or when we want to upcast the Object)
 * @param {InstanceTransformer} [transformer]
 *
 * @function inject
 *
 * @memberOf module:db-decorators.Decorators.injectables
 */
export const inject = (category?: string, transformer?: InstanceTransformer) => (target: any, propertyKey: string) => {

    const values = new WeakMap();

    const name: string | undefined = category || getTypeFromDecorator(target, propertyKey);
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
                            if (transformer)
                                try {
                                    obj = transformer(obj, target)
                                } catch(e) {
                                    error.call(this, e as Error)
                                }
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