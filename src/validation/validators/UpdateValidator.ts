import {
  DEFAULT_ERROR_MESSAGES as DecoratorMessages,
  Validator,
} from "@decaf-ts/decorator-validation";

/**
 * @description Abstract base class for validators that compare new values with old values during updates.
 * @summary Base class for an Update validator that provides a framework for implementing validation logic that compares a new value with its previous state.
 * @param {string} [message] - Error message. Defaults to {@link DecoratorMessages#DEFAULT}
 * @param {string[]} [acceptedTypes] - The accepted value types by the decorator
 * @class UpdateValidator
 * @example
 * // Extending UpdateValidator to create a custom validator
 * class MyCustomValidator extends UpdateValidator {
 *   constructor() {
 *     super("Custom validation failed");
 *   }
 *   
 *   public updateHasErrors(value: any, oldValue: any): string | undefined {
 *     // Custom validation logic
 *     if (value === oldValue) {
 *       return this.message;
 *     }
 *     return undefined;
 *   }
 *   
 *   hasErrors(value: any): string | undefined {
 *     return undefined; // Not used for update validators
 *   }
 * }
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
   * @description Abstract method that must be implemented by subclasses to perform update validation.
   * @summary Validates a value by comparing it to its old version to determine if the update is valid.
   * @param {any} value - The new value to validate
   * @param {any} oldValue - The previous value to compare against
   * @param {any[]} args - Additional arguments that may be needed for validation
   * @return {string | undefined} An error message if validation fails, undefined if validation passes
   */
  public abstract updateHasErrors(
    value: any,
    oldValue: any,
    ...args: any[]
  ): string | undefined;
}
