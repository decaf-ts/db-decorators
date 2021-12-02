import ModelErrorDefinition from "@tvenceslau/decorator-validation/lib/Model/ModelErrorDefinition";
import {
    DEFAULT_ERROR_MESSAGES as DecoratorMessages,
    Errors, getPropertyDecorators, getValidatorRegistry, isEqual, ModelErrors,
    ValidationPropertyDecoratorDefinition
} from "@tvenceslau/decorator-validation/lib";
import DBModel from "../model/DBModel";
import {DBKeys, DEFAULT_ERROR_MESSAGES} from "../model";
import Validator from "@tvenceslau/decorator-validation/lib/validation/Validators/Validator";
import {UpdateValidationKeys} from "./constants";

export abstract class UpdateValidator extends Validator{
    constructor(validationKey: string, message: string = DecoratorMessages.DEFAULT, ...acceptedTypes: string[]) {
        super(validationKey, message, ...acceptedTypes);
    }

    public abstract updateHasErrors(value: any, oldValue: any, ...args: any[]): Errors
}

export class ReadOnlyValidator extends Validator{
    constructor() {
        super(UpdateValidationKeys.READONLY, DEFAULT_ERROR_MESSAGES.READONLY.INVALID);
    }

    hasErrors(value: any, ...args: any[]): Errors {
        return undefined;
    }

    public updateHasErrors(value: any, oldValue: any, message?: string): Errors {
        if (value === undefined)
            return;

        return isEqual(value, oldValue) ? undefined : this.getMessage(message || this.message);
    }
}

export class TimestampValidator extends Validator{
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

        try{
            value = new Date(value);
            oldValue = new Date(oldValue);
        } catch (e) {
            return message
        }

        return value <= oldValue ? message : undefined;
    }
}

export function validateCompare<T extends DBModel>(oldModel: T, newModel: T, ...exceptions: string[]): ModelErrorDefinition | undefined{
    const decoratedProperties: ValidationPropertyDecoratorDefinition[] = [];
    for (let prop in newModel)
        if (newModel.hasOwnProperty(prop) && exceptions.indexOf(prop) === -1)
            decoratedProperties.push(getPropertyDecorators(UpdateValidationKeys.REFLECT, newModel, prop));

    const result =  decoratedProperties.reduce((accum: undefined | ModelErrors, decoratedProperty: ValidationPropertyDecoratorDefinition) => {
        const {prop, decorators} = decoratedProperty;

        if (!decorators || !decorators.length)
            return accum;

        decorators.shift(); // remove the design:type decorator, since the type will already be checked

        const errs: {[indexer: string]: Errors} | undefined = decorators.reduce((acc: undefined | {[indexer: string]: Errors}, decorator: {key: string, props: {}}) => {
            const validator: UpdateValidator = getValidatorRegistry().get(decorator.key) as UpdateValidator;
            if (!validator){
                console.error(`Could not find Matching validator for ${decorator.key} for property ${String(decoratedProperty.prop)}`);
                return acc;
            }

            const err: Errors = validator.updateHasErrors(newModel[prop.toString()], oldModel[prop.toString()], ...Object.values(decorator.props));
            if (err){
                acc = acc || {};
                acc[decorator.key] = err;
            }

            return acc;
        }, undefined);

        if (errs){
            accum = accum || {};
            accum[decoratedProperty.prop.toString()] = errs;
        }

        return accum;
    }, undefined);
    return result ? new ModelErrorDefinition(result) : undefined;
}