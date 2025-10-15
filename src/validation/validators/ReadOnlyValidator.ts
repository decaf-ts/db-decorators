import { validator, Validator } from "@decaf-ts/decorator-validation";
import { DEFAULT_ERROR_MESSAGES, UpdateValidationKeys } from "../constants";
import { isEqual } from "@decaf-ts/reflection";

/**
 * @description A validator that ensures properties marked as readonly cannot be modified during updates.
 * @summary Validator for the {@link readonly} decorator that checks if a value has been changed during an update operation. It compares the new value with the old value and returns an error message if they are not equal.
 * @param {any} value - The value to be validated
 * @param {any} oldValue - The previous value to compare against
 * @param {string} [message] - Optional custom error message
 * @class ReadOnlyValidator
 * @example
 * // Using ReadOnlyValidator with a readonly property
 * class User {
 *   @readonly()
 *   id: string;
 *
 *   name: string;
 *
 *   constructor(id: string, name: string) {
 *     this.id = id;
 *     this.name = name;
 *   }
 * }
 *
 * // This will trigger validation error when trying to update
 * const user = new User('123', 'John');
 * user.id = '456'; // Will be prevented by ReadOnlyValidator
 * @category Validators
 */
@validator(UpdateValidationKeys.READONLY)
export class ReadOnlyValidator extends Validator {
  constructor() {
    super(DEFAULT_ERROR_MESSAGES.READONLY.INVALID);
  }

  /**
   * @description Implementation of the base validator's hasErrors method.
   * @summary This method is required by the Validator interface but not used in this validator as validation only happens during updates.
   * @param {any} value - The value to validate
   * @param {any[]} args - Additional arguments
   * @return {string | undefined} Always returns undefined as this validator only works during updates
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasErrors(value: any, ...args: any[]): string | undefined {
    return undefined;
  }

  /**
   * @description Checks if a value has been modified during an update operation.
   * @summary Validates a value has not changed by comparing it with the previous value using deep equality.
   * @param {any} value - The new value to validate
   * @param {any} oldValue - The original value to compare against
   * @param {string} [message] - Optional custom error message to override the default
   * @return {string | undefined} An error message if validation fails, undefined otherwise
   */
  public updateHasErrors(
    value: any,
    oldValue: any,
    message?: string
  ): string | undefined {
    if (value === undefined) return;

    return isEqual(value, oldValue)
      ? undefined
      : this.getMessage(message || this.message);
  }
}
