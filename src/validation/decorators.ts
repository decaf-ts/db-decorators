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
 * @description Prevents a property from being modified after initial creation.
 * @summary Marks the property as readonly, causing validation errors if attempts are made to modify it during updates.
 * @param {string} [message] - The error message to display when validation fails. Defaults to {@link DEFAULT_ERROR_MESSAGES.READONLY.INVALID}
 * @return {PropertyDecorator} A decorator function that can be applied to class properties
 * @function readonly
 * @category Property Decorators
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

/**
 * @description Handler function that sets a timestamp property to the current timestamp.
 * @summary Updates a model property with the current timestamp from the repository context.
 * @template M - The model type extending Model
 * @template R - The repository type extending IRepository
 * @template V - The data type for the operation
 * @template F - The repository flags type
 * @template C - The context type
 * @param {C} context - The repository context containing the current timestamp
 * @param {V} data - The data being processed
 * @param key - The property key to update
 * @param {M} model - The model instance being updated
 * @return {Promise<void>} A promise that resolves when the timestamp has been set
 * @function timestampHandler
 * @memberOf module:db-decorators
 */
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
 * @description Automatically manages timestamp properties for tracking creation and update times.
 * @summary Marks the property as a timestamp, making it required and ensuring it's a valid date. The property will be automatically updated with the current timestamp during specified operations.
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
 * @param {OperationKeys[]} operation - The operations to act on. Defaults to {@link DBOperations.CREATE_UPDATE}
 * @param {string} [format] - The timestamp format. Defaults to {@link DEFAULT_TIMESTAMP_FORMAT}
 * @return {PropertyDecorator} A decorator function that can be applied to class properties
 * @function timestamp
 * @category Property Decorators
 * @mermaid
 * sequenceDiagram
 *   participant C as Client
 *   participant M as Model
 *   participant T as TimestampDecorator
 *   participant V as Validator
 *
 *   C->>M: Create/Update model
 *   M->>T: Process timestamp property
 *   T->>M: Apply required validation
 *   T->>M: Apply date format validation
 *
 *   alt Update operation
 *     T->>V: Register timestamp validator
 *     V->>M: Validate timestamp is newer
 *   end
 *
 *   T->>M: Set current timestamp
 *   M->>C: Return updated model
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

/**
 * @description Handler function that serializes a property to JSON string during create and update operations.
 * @summary Converts a complex object property to a JSON string before storing it in the database.
 * @template M - The model type extending Model
 * @template R - The repository type extending IRepository
 * @template V - The data type for the operation
 * @template F - The repository flags type
 * @template C - The context type
 * @param {C} context - The repository context
 * @param {V} data - The data being processed
 * @param key - The property key to serialize
 * @param {M} model - The model instance being processed
 * @return {Promise<void>} A promise that resolves when the property has been serialized
 * @function serializeOnCreateUpdate
 * @memberOf module:db-decorators
 */
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

/**
 * @description Handler function that deserializes a property from JSON string after database operations.
 * @summary Converts a JSON string property back to its original complex object form after retrieving it from the database.
 * @template M - The model type extending Model
 * @template R - The repository type extending IRepository
 * @template V - The data type for the operation
 * @template F - The repository flags type
 * @template C - The context type
 * @param {C} context - The repository context
 * @param {V} data - The data being processed
 * @param key - The property key to deserialize
 * @param {M} model - The model instance being processed
 * @return {Promise<void>} A promise that resolves when the property has been deserialized
 * @function serializeAfterAll
 * @memberOf module:db-decorators
 */
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
 * @description Enables automatic JSON serialization and deserialization for complex object properties.
 * @summary Decorator that automatically converts complex objects to JSON strings before storing in the database and back to objects when retrieving them.
 * @return {PropertyDecorator} A decorator function that can be applied to class properties
 * @function serialize
 * @category Property Decorators
 * @mermaid
 * sequenceDiagram
 *   participant C as Client
 *   participant M as Model
 *   participant S as SerializeDecorator
 *   participant DB as Database
 *
 *   Note over C,DB: Create/Update Flow
 *   C->>M: Set complex object property
 *   M->>S: Process property (create/update)
 *   S->>M: Convert to JSON string
 *   M->>DB: Store serialized data
 *
 *   Note over C,DB: Retrieval Flow
 *   C->>M: Request model
 *   M->>DB: Fetch data
 *   DB->>M: Return with serialized property
 *   M->>S: Process property (after all ops)
 *   S->>M: Parse JSON back to object
 *   M->>C: Return model with deserialized property
 */
export function serialize() {
  return apply(
    onCreateUpdate(serializeOnCreateUpdate),
    after(DBOperations.ALL, serializeAfterAll),
    type([String.name, Object.name]),
    metadata(Repository.key(DBKeys.SERIALIZE), {})
  );
}
