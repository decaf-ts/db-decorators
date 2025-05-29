import { validator, Validator } from "@decaf-ts/decorator-validation";
import { DEFAULT_ERROR_MESSAGES, UpdateValidationKeys } from "../constants";

/**
 * @description A validator that ensures timestamp values are only updated with newer timestamps.
 * @summary Validates the update of a timestamp by comparing the new timestamp with the old one, ensuring the new timestamp is more recent.
 * @param {Date|string|number} value - The timestamp value to validate
 * @param {Date|string|number} oldValue - The previous timestamp to compare against
 * @param {string} [message] - Optional custom error message
 * @class TimestampValidator
 * @example
 * // Using TimestampValidator with a timestamp property
 * class Document {
 *   @timestamp()
 *   updatedAt: Date;
 *   
 *   title: string;
 *   
 *   constructor(title: string) {
 *     this.title = title;
 *     this.updatedAt = new Date();
 *   }
 * }
 * 
 * // This will trigger validation error when trying to update with an older timestamp
 * const doc = new Document('My Document');
 * const oldDate = new Date(2020, 0, 1);
 * doc.updatedAt = oldDate; // Will be prevented by TimestampValidator
 * @category Validators
 */
@validator(UpdateValidationKeys.TIMESTAMP)
export class TimestampValidator extends Validator {
  constructor() {
    super(DEFAULT_ERROR_MESSAGES.TIMESTAMP.INVALID);
  }

  /**
   * @description Implementation of the base validator's hasErrors method.
   * @summary This method is required by the Validator interface but not used in this validator as validation only happens during updates.
   * @param {any} value - The timestamp value to validate
   * @param {any[]} args - Additional arguments
   * @return {string | undefined} Always returns undefined as this validator only works during updates
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasErrors(value: any, ...args: any[]): string | undefined {
    return undefined;
  }

  /**
   * @description Validates that a timestamp is newer than its previous value.
   * @summary Checks if a timestamp has been updated with a more recent value by converting both values to Date objects and comparing them.
   * @param {Date|string|number} value - The new timestamp value to validate
   * @param {Date|string|number} oldValue - The original timestamp to compare against
   * @param {string} [message] - Optional custom error message to override the default
   * @return {string | undefined} An error message if validation fails (new timestamp is not newer), undefined otherwise
   */
  public updateHasErrors(
    value: Date | string | number,
    oldValue: Date | string | number,
    message?: string
  ): string | undefined {
    if (value === undefined) return;

    message = message || this.getMessage(message || this.message);

    try {
      value = new Date(value);
      oldValue = new Date(oldValue);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return message;
    }

    return value <= oldValue ? message : undefined;
  }
}
