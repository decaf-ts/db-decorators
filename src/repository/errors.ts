/**
 * @summary Base Error
 *
 * @param {string} msg the error message
 *
 * @class BaseDLTError
 * @extends Error
 */
export abstract class BaseError extends Error {
  readonly code!: number;
  protected constructor(name: string, msg: string | Error, code: number = 500) {
    if (msg instanceof BaseError) return msg;
    const message = `[${name}] ${msg instanceof Error ? msg.message : msg}`;
    super(message);
    this.code = code;
    if (msg instanceof Error) this.stack = msg.stack;
  }
}

/**
 * @summary Represents a failure in the Model details
 *
 * @param {string} msg the error message
 *
 * @class ValidationError
 * @extends BaseError
 */
export class ValidationError extends BaseError {
  constructor(msg: string | Error) {
    super(ValidationError.name, msg, 422);
  }
}
/**
 * @summary Represents an internal failure (should mean an error in code)
 *
 * @param {string} msg the error message
 *
 * @class InternalError
 * @extends BaseError
 */
export class InternalError extends BaseError {
  constructor(msg: string | Error) {
    super(InternalError.name, msg, 500);
  }
}
/**
 * @summary Represents a failure in the Model de/serialization
 *
 * @param {string} msg the error message
 *
 * @class SerializationError
 * @extends BaseError
 *
 */
export class SerializationError extends BaseError {
  constructor(msg: string | Error) {
    super(SerializationError.name, msg, 422);
  }
}

/**
 * @summary Represents a failure in finding a model
 *
 * @param {string} msg the error message
 *
 * @class NotFoundError
 * @extends BaseError
 *
 */
export class NotFoundError extends BaseError {
  constructor(msg: string | Error) {
    super(NotFoundError.name, msg, 404);
  }
}
/**
 * @summary Represents a conflict in the storage
 *
 * @param {string} msg the error message
 *
 * @class ConflictError
 * @extends BaseError
 *
 */
export class ConflictError extends BaseError {
  constructor(msg: string | Error) {
    super(ConflictError.name, msg, 409);
  }
}
