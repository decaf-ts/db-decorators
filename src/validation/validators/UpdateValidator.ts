import {
  DEFAULT_ERROR_MESSAGES as DecoratorMessages,
  Validator,
} from "@decaf-ts/decorator-validation";

/**
 * @summary Base class for an Update validator
 *
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
    message: string = DecoratorMessages.DEFAULT,
    ...acceptedTypes: string[]
  ) {
    super(message, ...acceptedTypes);
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
  ): string | undefined;
}
