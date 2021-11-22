import "reflect-metadata";
import {DEFAULT_ERROR_MESSAGES, DBKeys, DEFAULT_TIMESTAMP_FORMAT} from "./constants";
import {DBOperations, on, Generators} from "../operations";
import {date, required} from "@tvenceslau/decorator-validation/lib";
import DBModel from "./DBModel";
import {IGeneratorAsync, IGenerator} from "../repository/generators";
import {Callback, Err, ModelCallback, Repository} from "../repository";


const getDBKey = (str: string) => DBKeys.REFLECT + str;

/**
 * Marks the property as readonly.
 *
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.READONLY.INVALID}
 * @decorator readonly
 * @namespace decorators
 * @memberOf model
 */
export function readonly(message: string = DEFAULT_ERROR_MESSAGES.READONLY.INVALID) {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata(
            getDBKey(DBKeys.READONLY),
            {
                message: message
            },
            target,
            propertyKey
        );
    }
}



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

/**
 * Marks the property as timestamp.
 * Makes it {@link required}
 * Makes it a {@link date}
 *
 * Date Format:
 *
 * <pre>
 *      Using similar formatting as Moment.js, Class DateTimeFormatter (Java), and Class SimpleDateFormat (Java),
 *      I implemented a comprehensive solution formatDate(date, patternStr) where the code is easy to read and modify.
 *      You can display date, time, AM/PM, etc.
 *
 *      Date and Time Patterns
 *      yy = 2-digit year; yyyy = full year
 *      M = digit month; MM = 2-digit month; MMM = short month name; MMMM = full month name
 *      EEEE = full weekday name; EEE = short weekday name
 *      d = digit day; dd = 2-digit day
 *      h = hours am/pm; hh = 2-digit hours am/pm; H = hours; HH = 2-digit hours
 *      m = minutes; mm = 2-digit minutes; aaa = AM/PM
 *      s = seconds; ss = 2-digit seconds
 *      S = miliseconds
 * </pre>
 *
 * @param {string[]} operation The {@link DBOperations} to act on. Defaults to {@link DBOperations.CREATE_UPDATE}
 * @param {string} [format] The TimeStamp format. defaults to {@link DEFAULT_TIMESTAMP_FORMAT}
 * @decorator timestamp
 * @namespace decorators
 * @memberOf model
 */
export const timestamp = (operation: string[] = DBOperations.CREATE_UPDATE, format: string = DEFAULT_TIMESTAMP_FORMAT) => (target: any, propertyKey: string) => {
    date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE)(target, propertyKey);
    required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED)(target, propertyKey);
    on(operation, function(this: Repository<DBModel>, model: DBModel, callback?: Callback){
        model[propertyKey] = new Date();
        if (callback)
            return callback(undefined, model);
    })(target,propertyKey);
    Reflect.defineMetadata(
        getDBKey(DBKeys.TIMESTAMP),
        {
            message: DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE
        },
        target,
        propertyKey
    );
}

// export const user = (operation: string[] = DBOperations.CREATE_UPDATE, format: string = "") => (target: any, propertyKey: string) => {
//     date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE)(target, propertyKey);
//     required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED)(target, propertyKey);
//     on(operation, () => Date.now());
// }