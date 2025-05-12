import "./validation";
import {
  date,
  Decoration,
  Model,
  propMetadata,
  required,
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
import { RepositoryFlags } from "../repository/types";

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
  R extends IRepository<M, F, C>,
  V,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(this: R, context: C, data: V, key: keyof M, model: M): Promise<void> {
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

  return Decoration.for(key)
    .define(...decorators)
    .apply();
}

export async function serializeOnCreateUpdate<
  M extends Model,
  R extends IRepository<M, F, C>,
  V,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(this: R, context: C, data: V, key: keyof M, model: M): Promise<void> {
  if (!model[key]) return;
  try {
    model[key] = JSON.stringify(model[key]) as M[keyof M];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: unknown) {
    throw new SerializationError(
      `Failed to serialize ${key.toString()} property of model ${model.constructor.name}: e`
    );
  }
}

export async function serializeAfterAll<
  M extends Model,
  R extends IRepository<M, F, C>,
  V,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
>(this: R, context: C, data: V, key: keyof M, model: M): Promise<void> {
  if (!model[key]) return;
  if (typeof model[key] !== "string") return;

  try {
    model[key] = JSON.parse(model[key]);
  } catch (e: unknown) {
    throw new SerializationError(
      `Failed to deserialize ${key.toString()} property of model ${model.constructor.name}: ${e}`
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
