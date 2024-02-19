import {
    DEFAULT_ERROR_MESSAGES as DecoratorMessages,
    Errors,
    isEqual,
    Validator
} from "@glass-project1/decorator-validation";
import {DEFAULT_ERROR_MESSAGES, UpdateValidationKeys} from "../utils";

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
    protected constructor(validationKey: string, message: string = DecoratorMessages.DEFAULT, ...acceptedTypes: string[]) {
        super(validationKey, message, ...acceptedTypes);
    }

    /**
     * @summary validates a value by comparing to its old version
     * @param {any} value
     * @param {any} oldValue
     * @param {any[]} args
     */
    public abstract updateHasErrors(value: any, oldValue: any, ...args: any[]): Errors
}

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
        super(UpdateValidationKeys.READONLY, DEFAULT_ERROR_MESSAGES.READONLY.INVALID);
    }

    /**
     * @inheritDoc
     */
    hasErrors(value: any, ...args: any[]): Errors {
        return undefined;
    }

    /**
     * @summary Validates a value has not changed
     * @param {any} value
     * @param {any} oldValue
     * @param {string} [message] the error message override
     */
    public updateHasErrors(value: any, oldValue: any, message?: string): Errors {
        if (value === undefined)
            return;

        return isEqual(value, oldValue) ? undefined : this.getMessage(message || this.message);
    }
}

/**
 * @summary Validates the update of a timestamp
 *
 * @class TimestampValidator
 * @extends Validator
 *
 * @category Validators
 */
export class TimestampValidator extends Validator {
    constructor() {
        super(UpdateValidationKeys.TIMESTAMP, DEFAULT_ERROR_MESSAGES.TIMESTAMP.INVALID);
    }

    hasErrors(value: any, ...args: any[]): Errors {
        return undefined;
    }

    public updateHasErrors(value: Date | string | number, oldValue: Date | string | number, message?: string): Errors {
        if (value === undefined)
            return;

        message = message || this.getMessage(message || this.message);

        try {
            value = new Date(value);
            oldValue = new Date(oldValue);
        } catch (e) {
            return message
        }

        return value <= oldValue ? message : undefined;
    }
}

