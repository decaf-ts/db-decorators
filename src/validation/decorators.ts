import {
  apply,
  CustomDecorator,
  date,
  metadata,
  required,
} from "@decaf-ts/decorator-validation";
import { DBKeys, DEFAULT_TIMESTAMP_FORMAT } from "../model/constants";
import { DEFAULT_ERROR_MESSAGES, UpdateValidationKeys } from "./constants";
import { DBOperations, OperationKeys } from "../operations/constants";
import { on } from "../operations/decorators";
import { Repository } from "../repository/Repository";
import { IRepository } from "../interfaces/IRepository";

export function getDBUpdateKey(str: string) {
  return UpdateValidationKeys.REFLECT + str;
}

/**
 * Marks the property as readonly.
 *
 * @param {string} [message] the error message. Defaults to {@link DEFAULT_ERROR_MESSAGES.READONLY.INVALID}
 *
 * @decorator readonly
 *
 * @category Decorators
 */
export function readonly(
  message: string = DEFAULT_ERROR_MESSAGES.READONLY.INVALID,
) {
  return metadata(getDBUpdateKey(DBKeys.READONLY), {
    message: message,
  });
}

export function timestampHandler(
  this: IRepository<any>,
  key: string,
  model: any,
) {
  model[key] = new Date();
  return model;
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
 * @param {{new: UpdateValidator}} [validator] defaults to {@link TimestampValidator}
 *
 * @decorator timestamp
 *
 * @category Decorators
 */
export function timestamp(
  operation: OperationKeys[] = DBOperations.CREATE_UPDATE as unknown as OperationKeys[],
  format: string = DEFAULT_TIMESTAMP_FORMAT,
) {
  const decorators: CustomDecorator<any>[] = [
    date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE) as CustomDecorator<any>,
    required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED) as CustomDecorator<any>,
    on(operation, timestampHandler) as CustomDecorator<any>,
  ];

  if (operation.indexOf(OperationKeys.UPDATE) !== -1)
    decorators.push(
      metadata(getDBUpdateKey(DBKeys.TIMESTAMP), {
        message: DEFAULT_ERROR_MESSAGES.TIMESTAMP.INVALID,
      }),
    );

  return apply(...decorators);
}
