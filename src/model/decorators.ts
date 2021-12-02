import "reflect-metadata";
import {DEFAULT_ERROR_MESSAGES, DBKeys} from "./constants";
import {DBOperations, on, Generators} from "../operations";
import {required} from "@tvenceslau/decorator-validation/lib";
import DBModel from "./DBModel";
import {IGeneratorAsync, IGenerator} from "../repository/generators";
import {Err, ModelCallback, Repository} from "../repository";
import {readonly} from "../validation";

const getDBKey = (str: string) => DBKeys.REFLECT + str;


/**
 * Marks the property as ID.
 * Makes it required
 * Makes it readonly
 *
 * @param {Generators<T>} generator
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.ID.INVALID}
 * @decorator id
 * @namespace decorators
 * @memberOf model
 */
export function id<T extends DBModel>(generator: Generators<T>, message: string = DEFAULT_ERROR_MESSAGES.ID.INVALID) {
    return (target: T, propertyKey: string) => {
        required(DEFAULT_ERROR_MESSAGES.ID.REQUIRED)(target, propertyKey);
        readonly()(target, propertyKey);
        on(DBOperations.CREATE, function(this: Repository<T>, model: T, ...args: any[]){
            const gen: IGenerator<T> | IGeneratorAsync<T> = new generator();

            const updater = function(target: T, propertyKey: string, value: any){
                Object.defineProperty(target, propertyKey, {
                    enumerable: true,
                    writable: false,
                    configurable: false,
                    value: value
                });
            }

            const isAsync = typeof args[args.length - 1] === 'function';

            if (!isAsync){
                const value = gen.generate(model, ...args);
                updater(model, propertyKey, value);
                return model;
            }

            const callback: ModelCallback<T> = args.pop();

            gen.generate(model, ...args, (err: Err, value: any) => {
                if (err)
                    return callback(err);
                updater(model, propertyKey, value)
                callback(undefined, model);
            });
        })(target, propertyKey);
        Reflect.defineMetadata(
            getDBKey(DBKeys.ID),
            {
                target: target.name,
                message: message
            },
            target,
            propertyKey
        );
    }
}

// export const user = (operation: string[] = DBOperations.CREATE_UPDATE, format: string = "") => (target: any, propertyKey: string) => {
//     date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE)(target, propertyKey);
//     required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED)(target, propertyKey);
//     on(operation, () => Date.now());
// }