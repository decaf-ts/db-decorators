/**
 * @summary Base Error
 *
 * @param {string} msg the error message
 *
 * @class BaseDLTError
 * @extends Error
 */
export abstract class BaseError extends Error {
  protected constructor(name: string, msg: string | Error) {
    if (msg instanceof BaseError) return msg;
    const message = `[${name}] ${msg instanceof Error ? msg.message : msg}`;
    super(message);
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
    super(ValidationError.name, msg);
  }
}
/**
 * @summary Represents a failure in observer communication
 *
 * @param {string} msg the error message
 *
 * @class ObserverError
 * @extends BaseError
 */
export class ObserverError extends BaseError {
  constructor(msg: string | Error) {
    super(ObserverError.name, msg);
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
    super(InternalError.name, msg);
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
    super(SerializationError.name, msg);
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
    super(NotFoundError.name, msg);
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
    super(ConflictError.name, msg);
  }
}
