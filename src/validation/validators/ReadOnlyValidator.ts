import { validator, Validator } from "@decaf-ts/decorator-validation";
import { DEFAULT_ERROR_MESSAGES, UpdateValidationKeys } from "../constants";
import { isEqual } from "@decaf-ts/reflection";

/**
 * @summary Validator for the {@link readonly} decorator
 *
 * @class ReadOnlyValidator
 * @extends Validator
 *
 * @category Validators
 */
@validator(UpdateValidationKeys.READONLY)
export class ReadOnlyValidator extends Validator {
  constructor() {
    super(DEFAULT_ERROR_MESSAGES.READONLY.INVALID);
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasErrors(value: any, ...args: any[]): string | undefined {
    return undefined;
  }

  /**
   * @summary Validates a value has not changed
   * @param {any} value
   * @param {any} oldValue
   * @param {string} [message] the error message override
   */
  public updateHasErrors(
    value: any,
    oldValue: any,
    message?: string,
  ): string | undefined {
    if (value === undefined) return;

    return isEqual(value, oldValue)
      ? undefined
      : this.getMessage(message || this.message);
  }
}
