import {
    Constructor,
    date,
    getValidatorRegistry,
    required,
    ValidatorDefinition
} from "@glass-project1/decorator-validation";
import {Callback, DEFAULT_TIMESTAMP_FORMAT, Err} from "@glass-project1/logging";
import {injectable} from "../../injectables";
import {ModelCallback, Repository} from "./types";
import {DBOperations, on, OperationKeys} from "./operations";
import {DBModel, Generators, IGenerator, IGeneratorAsync} from "../../model";
import {ReadOnlyValidator, TimestampValidator, UpdateValidator} from "../../validators";
import {DBKeys, DEFAULT_ERROR_MESSAGES, UpdateValidationKeys} from "../../utils";
import {RepositoryKeys} from "./constants";
import {getRepoKeyKey} from "./transactions";

/**
 * @summary Defines a class as a repository (makes it injectable)
 * and forces an instantiation over any other possible with that key
 *
 * @param {string} [category] category name to be passed to injectables {@link injectable}
 * @param {any[]} [props] optional props to be passed to {@link injectable}
 *
 * @see injectable
 * with args:
 *  - singleton: true;
 *  - force: true;
 *  - args: {@param props}
 *
 * @function repository
 *
 * @memberOf module:db-decorators.Decorators.model
 */
export function repository(category?: string, ...props: any[]){
    return (original: Function) => {
        const transactionalRepoConstructor = Transactional()(original)
        return injectable(category, true, ...props)(transactionalRepoConstructor);
    }
}

/**
 * @summary tags a class as Transactional
 * @function Transactional
 * @memberOf module:db-decorators.Decorators.transactions
 */
export function Transactional(){
    return (original: any) => {
        const newConstructor : any = function (...args: any[]) {
            const instance = new (original as {new(...args: any[]): any})(...args)

            Reflect.defineMetadata(
                getRepoKeyKey(RepositoryKeys.TRANSACTIONAL),
            {},
                instance.constructor
            );

            return instance;
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
}
/**
 * @summary gets the reflection DB update key
 * @param {str} str
 *
 * @function getDBUpdateKey
 * @memberOf module:db-decorators.Repository */
const getDBUpdateKey = (str: string) => UpdateValidationKeys.REFLECT + str;

/**
 * @summary Marks the property as readonly.
 *
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.READONLY.INVALID}
 * @param {{new: UpdateValidator}} [validator] defaults to {@link ReadOnlyValidator}
 *
 * @function readonly
 *
 * @memberOf module:db-decorators.Decorators.validation
 */
export function readonly(message: string = DEFAULT_ERROR_MESSAGES.READONLY.INVALID, validator: Constructor<UpdateValidator> = ReadOnlyValidator) {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata(
            getDBUpdateKey(DBKeys.READONLY),
            {
                message: message
            },
            target,
            propertyKey
        );
        getValidatorRegistry().register({validator: validator, validationKey: UpdateValidationKeys.READONLY, save: true})
    }
}

/**
 * @summary Marks the property as timestamp.
 * @description Makes it {@link required}
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
 * @param {{new: UpdateValidator}} [validator] defaults to {@link TimestampValidator}
 *
 * @function timestamp
 *
 * @memberOf module:db-decorators.Decorators.validation
 */
export const timestamp = (operation: string[] = DBOperations.CREATE_UPDATE, format: string = DEFAULT_TIMESTAMP_FORMAT, validator: Constructor<UpdateValidator> = TimestampValidator) => (target: any, propertyKey: string) => {
    date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE)(target, propertyKey);
    required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED)(target, propertyKey);
    on(operation, function (this: Repository<DBModel>, key: string, model: DBModel, callback?: Callback) {
        model[key] = new Date();
        if (callback)
            return callback(undefined, model);
    })(target, propertyKey);

    if (operation.indexOf(OperationKeys.UPDATE) !== -1) {
        Reflect.defineMetadata(
            getDBUpdateKey(DBKeys.TIMESTAMP),
            {
                message: DEFAULT_ERROR_MESSAGES.TIMESTAMP.INVALID
            },
            target,
            propertyKey
        );

        getValidatorRegistry().register({validator: validator, validationKey: UpdateValidationKeys.TIMESTAMP, save:true})
    }
}

/**
 * @summary gets the repository reflection key
 * @param {str} str
 *
 * @function getDBKey
 * @memberOf module:db-decorators.Repository
 */
export const getDBKey = (str: string) => DBKeys.REFLECT + str;

/**
 * @summary ID property
 * @description Marks the property as ID.
 * Makes it required
 * Makes it readonly
 *
 * @param {Generators<T>} generator
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.ID.INVALID}
 *
 * @function id
 *
 * @memberOf module:db-decorators.Decorators.validation
 */
export function id<T extends DBModel>(generator: Generators<T>, message: string = DEFAULT_ERROR_MESSAGES.ID.INVALID) {
    return (target: T, propertyKey: string) => {
        required(DEFAULT_ERROR_MESSAGES.ID.REQUIRED)(target, propertyKey);
        readonly()(target, propertyKey);
        on(DBOperations.CREATE, function (this: Repository<T>, key: string, model: T, ...args: any[]) {
            const gen: IGenerator<T> | IGeneratorAsync<T> = new generator();

            const updater = function (target: T, propertyKey: string, value: any) {
                Object.defineProperty(target, propertyKey, {
                    enumerable: true,
                    writable: false,
                    configurable: true,
                    value: value
                });
            }

            const isAsync = typeof args[args.length - 1] === 'function';

            if (!isAsync) {
                const value = gen.generate(this, model, ...args);
                updater(model, key, value);
                return model;
            }

            const callback: ModelCallback<T> = args.pop();

            gen.generate(this, model, ...args, (err: Err, value: any) => {
                if (err)
                    return callback(err);
                updater(model, key, value)
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