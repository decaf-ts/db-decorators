import {
  DEFAULT_ERROR_MESSAGES as DecoratorMessages,
  Errors,
  Validator,
} from "@decaf-ts/decorator-validation";

/**
 * @summary Base class for an Update validator
 *
 * @param {string} validationKey
 * @param {string} [message] error message. defaults to {@link DecoratorMessages#DEFAULT}
 * @param {string[]} [acceptedTypes] the accepted value types by the decorator
 *
 * @class UpdateValidator
 * @abstract
 * @extends Validator
 *
 * @category Validators
 */
export abstract class UpdateValidator extends Validator {
  protected constructor(
    validationKey: string,
    message: string = DecoratorMessages.DEFAULT,
    ...acceptedTypes: string[]
  ) {
    super(validationKey, message, ...acceptedTypes);
  }

  /**
   * @summary validates a value by comparing to its old version
   * @param {any} value
   * @param {any} oldValue
   * @param {any[]} args
   */
  public abstract updateHasErrors(
    value: any,
    oldValue: any,
    ...args: any[]
  ): Errors;
}
