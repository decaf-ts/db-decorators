import {
  Validator,
  Validation,
  ValidatorDefinition,
  IValidatorRegistry,
} from "@decaf-ts/decorator-validation";
import { UpdateValidationKeys } from "./constants";

/**
 * @description Generates a key for update validation metadata.
 * @summary Builds the key to store as metadata under Reflections for update validation by prefixing the provided key with the update validation prefix.
 * @param {string} key - The base key to be prefixed
 * @return {string} The complete metadata key for update validation
 * @function updateKey
 * @memberOf module:db-decorators
 */
Validation.updateKey = function (key: string) {
  return UpdateValidationKeys.REFLECT + key;
};

declare module "@decaf-ts/decorator-validation" {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  declare class Validation {
    private static actingValidatorRegistry?;
    private constructor();
    /**
     * @summary Defines the acting ValidatorRegistry
     *
     * @param {IValidatorRegistry} validatorRegistry the new implementation of the validator Registry
     * @param {function(Validator): Validator} [migrationHandler] the method to map the validator if required;
     */
    static setRegistry(
      validatorRegistry: IValidatorRegistry<Validator>,
      migrationHandler?: (validator: Validator) => Validator
    ): void;
    /**
     * @summary Returns the current ValidatorRegistry
     *
     * @return IValidatorRegistry, defaults to {@link ValidatorRegistry}
     */
    private static getRegistry;
    /**
     * @summary Retrieves a validator
     *
     * @param {string} validatorKey one of the {@link ValidationKeys}
     * @return {Validator | undefined} the registered Validator or undefined if there is nono matching the provided key
     */
    static get<T extends Validator>(validatorKey: string): T | undefined;
    /**
     * @summary Registers the provided validators onto the registry
     *
     * @param {T[] | ValidatorDefinition[]} validator
     */
    static register<T extends Validator>(
      ...validator: (ValidatorDefinition | T)[]
    ): void;
    /**
     * @summary Builds the key to store as Metadata under Reflections
     * @description concatenates {@link ValidationKeys#REFLECT} with the provided key
     *
     * @param {string} key
     */
    static key(key: string): string;

    static updateKey(key: string): string;
  }
}
