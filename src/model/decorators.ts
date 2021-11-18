import "reflect-metadata";
import {DEFAULT_ERROR_MESSAGES, DBKeys} from "./constants";


const getDBKey = (str: string) => DBKeys.REFLECT + str;

/**
 * Marks the property as ID.
 *
 * Validators to validate a decorated property must use key {@link ValidationKeys.REQUIRED}
 *
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.REQUIRED}
 * @decorator id
 * @namespace decorators
 * @memberOf model
 */
export const id = (generator: () => any, message: string = DEFAULT_ERROR_MESSAGES.ID) => (target: any, propertyKey: string) => {
    Reflect.defineMetadata(
        getDBKey(DBKeys.ID),
        {
            target: target.constructor.name,
            message: message
        },
        target,
        propertyKey
    );
}