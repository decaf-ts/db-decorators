import { validator, Validator } from "@decaf-ts/decorator-validation";
import { DEFAULT_ERROR_MESSAGES, UpdateValidationKeys } from "../constants";

/**
 * @summary Validates the update of a timestamp
 *
 * @class TimestampValidator
 * @extends Validator
 *
 * @category Validators
 */
@validator(UpdateValidationKeys.TIMESTAMP)
export class TimestampValidator extends Validator {
  constructor() {
    super(DEFAULT_ERROR_MESSAGES.TIMESTAMP.INVALID);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasErrors(value: any, ...args: any[]): string | undefined {
    return undefined;
  }

  public updateHasErrors(
    value: Date | string | number,
    oldValue: Date | string | number,
    message?: string,
  ): string | undefined {
    if (value === undefined) return;

    message = message || this.getMessage(message || this.message);

    try {
      value = new Date(value);
      oldValue = new Date(oldValue);
    } catch (e) {
      return message;
    }

    return value <= oldValue ? message : undefined;
  }
}
