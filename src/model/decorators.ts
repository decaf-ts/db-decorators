import "reflect-metadata";
import {DEFAULT_ERROR_MESSAGES, DBKeys, DEFAULT_TIMESTAMP_FORMAT} from "./constants";
import {DBOperations, on, Generators} from "../operations";
import {date, required} from "@tvenceslau/decorator-validation/lib";
import DBModel from "./DBModel";


const getDBKey = (str: string) => DBKeys.REFLECT + str;

/**
 * Marks the property as ID.
 * Makes it required
 *
 * @param {Generators<T>} generator
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.ID}
 * @decorator id
 * @namespace decorators
 * @memberOf model
 */
export function id<T extends DBModel>(generator: Generators<T>, message: string = DEFAULT_ERROR_MESSAGES.ID) {
    return (target: any, propertyKey: string) => {
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
    on(operation, () => Date.now());
}

// export const user = (operation: string[] = DBOperations.CREATE_UPDATE, format: string = "") => (target: any, propertyKey: string) => {
//     date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE)(target, propertyKey);
//     required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED)(target, propertyKey);
//     on(operation, () => Date.now());
// }