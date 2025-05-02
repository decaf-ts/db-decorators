import {
  date,
  Decoration,
  Model,
  propMetadata,
  required,
  sf,
  type,
  Validation,
} from "@decaf-ts/decorator-validation";
import { DBKeys, DEFAULT_TIMESTAMP_FORMAT } from "../model/constants";
import { DEFAULT_ERROR_MESSAGES } from "./constants";
import { DBOperations, OperationKeys } from "../operations/constants";
import { after, on, onCreateUpdate } from "../operations/decorators";
import { IRepository } from "../interfaces/IRepository";
import { SerializationError } from "../repository/errors";
import { apply, metadata } from "@decaf-ts/reflection";
import { Repository } from "../repository";
import { Context } from "../repository/Context";

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
  message: string = DEFAULT_ERROR_MESSAGES.READONLY.INVALID
) {
  const key = Validation.updateKey(DBKeys.READONLY);
  return Decoration.for(key)
    .define(
      propMetadata(key, {
        message: message,
      })
    )
    .apply();
}

export async function timestampHandler<
  M extends Model,
  V extends IRepository<M>,
  Y = any,
>(this: V, context: Context<M>, data: Y, key: string, model: M): Promise<void> {
  (model as any)[key] = context.timestamp;
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
  format: string = DEFAULT_TIMESTAMP_FORMAT
) {
  const key = Validation.updateKey(DBKeys.TIMESTAMP);

  const decorators: any[] = [
    date(format, DEFAULT_ERROR_MESSAGES.TIMESTAMP.DATE),
    required(DEFAULT_ERROR_MESSAGES.TIMESTAMP.REQUIRED),
    on(operation, timestampHandler),
  ];

  if (operation.indexOf(OperationKeys.UPDATE) !== -1)
    decorators.push(
      propMetadata(Validation.updateKey(DBKeys.TIMESTAMP), {
        message: DEFAULT_ERROR_MESSAGES.TIMESTAMP.INVALID,
      })
    );

  Decoration.for(key)
    .define(...decorators)
    .apply();
}

export async function serializeOnCreateUpdate<
  T extends Model,
  V extends IRepository<T>,
  Y = any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(this: V, data: Y, key: string, model: T, oldModel: T): Promise<void> {
  if (!(model as any)[key]) return;
  try {
    (model as any)[key] = JSON.stringify((model as any)[key]);
  } catch (e: any) {
    throw new SerializationError(
      sf(
        "Failed to serialize {0} property on {1} model: {2}",
        key,
        model.constructor.name,
        e.message
      )
    );
  }
}

export async function serializeAfterAll<
  T extends Model,
  V extends IRepository<T>,
  Y = any,
>(this: V, data: Y, key: string, model: T): Promise<void> {
  if (!(model as any)[key]) return;
  if (typeof (model as any)[key] !== "string") return;

  try {
    (model as any)[key] = JSON.parse((model as any)[key]);
  } catch (e: any) {
    throw new SerializationError(
      sf(
        "Failed to deserialize {0} property on {1} model: {2}",
        key,
        model.constructor.name,
        e.message
      )
    );
  }
}

/**
 * @summary Serialize Decorator
 * @description properties decorated will the serialized before stored in the db
 *
 * @function serialize
 *
 * @memberOf module:wallet-db.Decorators
 */
export function serialize() {
  return apply(
    onCreateUpdate(serializeOnCreateUpdate),
    after(DBOperations.ALL, serializeAfterAll),
    type([String.name, Object.name]),
    metadata(Repository.key(DBKeys.SERIALIZE), {})
  );
}
