import { Errors, isEqual, Validator } from "@decaf-ts/decorator-validation";
import { DEFAULT_ERROR_MESSAGES, UpdateValidationKeys } from "../constants";

/**
 * @summary Validator for the {@link readonly} decorator
 *
 * @class ReadOnlyValidator
 * @extends Validator
 *
 * @category Validators
 */
export class ReadOnlyValidator extends Validator {
  constructor() {
    super(
      UpdateValidationKeys.READONLY,
      DEFAULT_ERROR_MESSAGES.READONLY.INVALID,
    );
  }

  /**
   * @inheritDoc
   */
  hasErrors(): Errors {
    return undefined;
  }

  /**
   * @summary Validates a value has not changed
   * @param {any} value
   * @param {any} oldValue
   * @param {string} [message] the error message override
   */
  public updateHasErrors(value: any, oldValue: any, message?: string): Errors {
    if (value === undefined) return;

    return isEqual(value, oldValue)
      ? undefined
      : this.getMessage(message || this.message);
  }
}
