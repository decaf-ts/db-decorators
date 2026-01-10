/**
 * @description Base error class for the repository module
 * @summary Abstract base error class that all other error types extend from. Provides common error handling functionality and standardized HTTP code mapping.
 * @param {string} name - The name of the error
 * @param {string|Error} msg - The error message or Error object to wrap
 * @param {number} code - The HTTP status code associated with this error
 * @return {void}
 * @class BaseError
 * @example
 * // This is an abstract class and should not be instantiated directly
 * // Instead, use one of the concrete error classes:
 * throw new ValidationError('Invalid data provided');
 * @mermaid
 * sequenceDiagram
 *   participant C as Caller
 *   participant E as BaseError
 *   C->>E: new BaseError(name,msg,code)
 *   E-->>C: Error instance with message and code
 * @category Errors
 */
export abstract class BaseError extends Error {
  readonly code!: number;
  protected constructor(name: string, msg: string | Error, code: number) {
    if (msg instanceof BaseError) return msg;
    const message = `[${name}] ${msg instanceof Error ? msg.message : msg}`;
    super(message);
    this.code = code;
    if (msg instanceof Error) this.stack = msg.stack;
  }

  override toString(): string {
    return `[${this.name}][${this.code}] ${this.message.replace(/\[.*?Error\]]\s/g, "")}`;
  }
}

/**
 * @description Error (40) thrown when a bad request is received
 * @summary Represents a failure in the input data, typically thrown when a client sends invalid or incomplete data
 * @param {string|Error} msg - The error message or Error object
 * @return {BadRequestError} A new BadRequestError instance
 * @class BadRequestError
 * @category Errors
 */
export class BadRequestError extends BaseError {
  constructor(msg: string | Error, name = BadRequestError.name, code = 400) {
    super(name, msg, code);
  }
}

/**
 * @description Error (422) thrown when validation fails
 * @summary Represents a failure in the Model details, typically thrown when data validation fails
 * @param {string|Error} msg - The error message or Error object
 * @return {ValidationError} A new ValidationError instance
 * @class ValidationError
 * @example
 * // Throw a validation error when data is invalid
 * if (!isValid(data)) {
 *   throw new ValidationError('Invalid data format');
 * }
 * @category Errors
 */
export class ValidationError extends BadRequestError {
  constructor(msg: string | Error) {
    super(msg, ValidationError.name, 422);
  }
}
/**
 * @description Error (500) thrown for internal system failures
 * @summary Represents an internal failure (should mean an error in code) with HTTP 500 status code
 * @param {string|Error} msg - The error message or Error object
 * @return {InternalError} A new InternalError instance
 * @class InternalError
 * @example
 * // Throw an internal error when an unexpected condition occurs
 * try {
 *   // Some operation
 * } catch (error) {
 *   throw new InternalError('Unexpected internal error occurred');
 * }
 * @category Errors
 */
export class InternalError extends BaseError {
  constructor(msg: string | Error, name = InternalError.name, code = 500) {
    super(name, msg, code);
  }
}
/**
 * @description Error (500) thrown when serialization or deserialization fails
 * @summary Represents a failure in the Model de/serialization, typically when converting between data formats
 * @param {string|Error} msg - The error message or Error object
 * @return {SerializationError} A new SerializationError instance
 * @class SerializationError
 * @example
 * // Throw a serialization error when JSON parsing fails
 * try {
 *   const data = JSON.parse(invalidJson);
 * } catch (error) {
 *   throw new SerializationError('Failed to parse JSON data');
 * }
 * @category Errors
 */
export class SerializationError extends InternalError {
  constructor(msg: string | Error) {
    super(msg, SerializationError.name, 500);
  }
}

/**
 * @description Error thrown when a requested resource is not found
 * @summary Represents a failure in finding a model, resulting in a 404 HTTP status code
 * @param {string|Error} msg - The error message or Error object
 * @return {NotFoundError} A new NotFoundError instance
 * @class NotFoundError
 * @example
 * // Throw a not found error when a record doesn't exist
 * const user = await repository.findById(id);
 * if (!user) {
 *   throw new NotFoundError(`User with ID ${id} not found`);
 * }
 * @category Errors
 */
export class NotFoundError extends BadRequestError {
  constructor(msg: string | Error) {
    super(msg, NotFoundError.name, 404);
  }
}
/**
 * @description Error thrown when a conflict occurs in the storage
 * @summary Represents a conflict in the storage, typically when trying to create a duplicate resource
 * @param {string|Error} msg - The error message or Error object
 * @return {ConflictError} A new ConflictError instance
 * @class ConflictError
 * @example
 * // Throw a conflict error when trying to create a duplicate record
 * const existingUser = await repository.findByEmail(email);
 * if (existingUser) {
 *   throw new ConflictError(`User with email ${email} already exists`);
 * }
 * @category Errors
 */
export class ConflictError extends BadRequestError {
  constructor(msg: string | Error) {
    super(msg, ConflictError.name, 409);
  }
}
