import {
  Comparable,
  Hashable,
  ModelArg,
  ModelErrorDefinition,
  Serializable,
  Validatable,
  Model,
  validate,
  Constructor,
  ModelBuilderFunction,
  BuilderRegistry,
  ModelConstructor,
} from "@decaf-ts/decorator-validation";
import { validateCompare } from "./validation";

/**
 * @description Validates the model and checks for errors
 * @summary Validates the current model state and optionally compares with a previous version
 * @template M - Type extending Model
 * @param {M|any} [previousVersion] - Optional previous version of the model for comparison
 * @param {...any[]} exclusions - Properties to exclude from validation
 * @return {ModelErrorDefinition|undefined} Error definition if validation fails, undefined otherwise
 * @function hasErrors
 * @memberOf module:db-decorators
 */
Model.prototype.hasErrors = function <M extends Model>(
  this: M,
  previousVersion?: M | any,
  ...exclusions: any[]
): ModelErrorDefinition | undefined {
  if (previousVersion && !(previousVersion instanceof Model)) {
    exclusions.unshift(previousVersion);
    previousVersion = undefined;
  }

  const errs = validate(this, ...exclusions);
  if (errs || !previousVersion) return errs;

  return validateCompare(previousVersion, this, ...exclusions);
};

declare module "@decaf-ts/decorator-validation" {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  declare abstract class Model
    implements Validatable, Serializable, Hashable, Comparable<Model>
  {
    protected constructor(arg?: ModelArg<Model>);

    hasErrors(...exclusions: any[]): ModelErrorDefinition | undefined;
    hasErrors(
      previousVersion?: Model | any,
      ...exclusions: any[]
    ): ModelErrorDefinition | undefined;

    /**
     * @description Compares this model with another object for equality
     * @summary Compare object equality recursively, checking all properties
     * @param {any} obj - Object to compare to
     * @param {...string} exceptions - Property names to be excluded from the comparison
     * @return {boolean} True if objects are equal, false otherwise
     */
    equals(obj: any, ...exceptions: string[]): boolean;

    /**
     * @description Converts the model to a serialized string representation
     * @summary Returns the serialized model according to the currently defined {@link Serializer}
     * @return {string} Serialized representation of the model
     */
    serialize(): string;

    /**
     * @description Provides a string representation of the model
     * @summary Override the implementation for JavaScript's default toString() method
     * @return {string} String representation of the model
     * @override
     */
    toString(): string;

    /**
     * @description Generates a hash code for the model
     * @summary Defines a default implementation for object hash based on Java's string hash algorithm
     * @return {string} Hash code for the model
     */
    hash(): string;

    /**
     * @description Converts a serialized string back to a model instance
     * @summary Deserializes a Model from its string representation
     * @param {string} str - The serialized string to deserialize
     * @return {any} The deserialized model instance
     * @throws {Error} If it fails to parse the string, or if it fails to build the model
     */
    static deserialize(str: string): any;

    /**
     * @description Iterates all common properties of obj (if existing) and self, and copies them onto self
     * @summary Repopulates the Object properties with the ones from the new object
     * @template T - Type extending Model
     * @param {T} self - The target model instance to update
     * @param {T|Record<string, any>} [obj] - The source object to copy properties from
     * @return {T} The updated model instance
     */
    static fromObject<T extends Model>(
      self: T,
      obj?: T | Record<string, any>
    ): T;

    /**
     * @description Iterates all common properties of obj (if existing) and self, and copies them onto self. Is aware of nested Model Objects and rebuilds them also. When List properties are decorated with {@link list}, the list items will also be rebuilt
     * @summary Repopulates the instance with properties from the new Model Object, handling nested models
     * @template T - Type extending Model
     * @param {T} self - The target model instance to update
     * @param {T|Record<string, any>} [obj] - The source model or object to copy properties from
     * @return {T} The updated model instance
     */
    static fromModel<T extends Model>(
      self: T,
      obj?: T | Record<string, any>
    ): T;

    /**
     * @description Configures the global model builder function used for creating model instances
     * @summary Sets the Global {@link ModelBuilderFunction} used for model construction
     * @param {ModelBuilderFunction} [builder] - The builder function to set, or undefined to reset
     * @return {void}
     */
    static setBuilder(builder?: ModelBuilderFunction): void;

    /**
     * @description Returns the currently configured global model builder function
     * @summary Retrieves the current global {@link ModelBuilderFunction} used for model construction
     * @return {ModelBuilderFunction|undefined} The current builder function or undefined if not set
     */
    static getBuilder(): ModelBuilderFunction | undefined;

    /**
     * @description Retrieves the current model registry instance
     * @summary Returns the current {@link ModelRegistryManager} used for model registration
     * @return {BuilderRegistry<any>} ModelRegistry instance, defaults to {@link ModelRegistryManager}
     * @private
     */
    private static getRegistry;

    /**
     * @description Sets the model registry to be used for model registration and retrieval
     * @summary Configures the current model registry implementation
     * @param {BuilderRegistry<any>} modelRegistry - The new implementation of Registry to use
     * @return {void}
     */
    static setRegistry(modelRegistry: BuilderRegistry<any>): void;

    /**
     * @description Registers a model constructor with the model registry
     * @summary Registers new Models for later retrieval and instantiation
     * @template T - Type extending Model
     * @param {ModelConstructor<T>} constructor - The model constructor to register
     * @param {string} [name] - Optional name for registration, defaults to constructor name
     * @return {void}
     * @see ModelRegistry
     */
    static register<T extends Model>(
      constructor: ModelConstructor<T>,
      name?: string
    ): void;

    /**
     * @description Retrieves a previously registered model constructor by name
     * @summary Gets a registered Model {@link ModelConstructor} from the registry
     * @template T - Type extending Model
     * @param {string} name - The name of the model to retrieve
     * @return {ModelConstructor<T>|undefined} The model constructor or undefined if not found
     * @see ModelRegistry
     */
    static get<T extends Model>(name: string): ModelConstructor<T> | undefined;

    /**
     * @description Creates a new model instance from a plain object
     * @summary Builds a model instance using the registered constructor
     * @template T - Type extending Model
     * @param {Record<string, any>} [obj] - The source object to build from
     * @param {string} [clazz] - Optional class name to find the matching constructor
     * @return {T} The built model instance
     * @throws {Error} If clazz is not found, or obj is not a {@link Model} meaning it has no {@link ModelKeys.ANCHOR} property
     * @see ModelRegistry
     */
    static build<T extends Model>(obj?: Record<string, any>, clazz?: string): T;

    /**
     * @description Retrieves metadata associated with a model instance
     * @summary Gets the metadata attached to a model
     * @template V - Type extending Model
     * @param {V} model - The model instance to get metadata from
     * @return {any} The model's metadata
     */
    static getMetadata<V extends Model>(model: V): any;

    /**
     * @description Retrieves all attribute names defined on a model
     * @summary Gets the list of attributes for a model class or instance
     * @template V - Type extending Model
     * @param {(Constructor<V>|V)} model - The model constructor or instance
     * @return {string[]} Array of attribute names
     */
    static getAttributes<V extends Model>(model: Constructor<V> | V): string[];

    /**
     * @description Compares two model instances for equality
     * @summary Static method to check if two model instances are equal
     * @template M - Type extending Model
     * @param {M} obj1 - First model instance to compare
     * @param {M} obj2 - Second model instance to compare
     * @param {...any[]} exceptions - Properties to exclude from comparison
     * @return {boolean} True if models are equal, false otherwise
     */
    static equals<M extends Model>(
      obj1: M,
      obj2: M,
      ...exceptions: any[]
    ): boolean;

    /**
     * @description Validates a model and checks for errors
     * @summary Static method to validate a model instance
     * @template M - Type extending Model
     * @param {M} model - The model instance to validate
     * @param {...string[]} propsToIgnore - Properties to exclude from validation
     * @return {ModelErrorDefinition|undefined} Error definition if validation fails, undefined otherwise
     */
    static hasErrors<M extends Model>(
      model: M,
      ...propsToIgnore: string[]
    ): ModelErrorDefinition | undefined;

    /**
     * @description Serializes a model instance to a string
     * @summary Static method to convert a model to its serialized form
     * @template M - Type extending Model
     * @param {M} model - The model instance to serialize
     * @return {string} The serialized representation of the model
     */
    static serialize<M extends Model>(model: M): any;

    /**
     * @description Generates a hash code for a model instance
     * @summary Static method to create a hash code for a model
     * @template M - Type extending Model
     * @param {M} model - The model instance to hash
     * @return {string} The hash code for the model
     */
    static hash<M extends Model>(model: M): any;

    /**
     * @description Builds a metadata key for reflection
     * @summary Concatenates the model reflection prefix with the provided key string
     * @param {string} str - The key string to append to the reflection prefix
     * @return {string} The complete metadata key
     */
    static key(str: string): string;

    /**
     * @description Determines if an object is a model instance or has model metadata
     * @summary Checks whether a given object is either an instance of the Model class or
     * has model metadata attached to it. This function is essential for serialization and
     * deserialization processes, as it helps identify model objects that need special handling.
     * It safely handles potential errors during metadata retrieval.
     *
     * @param {Record<string, any>} target - The object to check
     * @return {boolean} True if the object is a model instance or has model metadata, false otherwise
     *
     * @example
     * ```typescript
     * // Check if an object is a model
     * const user = new User({ name: "John" });
     * const isUserModel = isModel(user); // true
     *
     * // Check a plain object
     * const plainObject = { name: "John" };
     * const isPlainObjectModel = isModel(plainObject); // false
     * ```
     */
    static isModel(target: Record<string, any>): boolean;

    /**
     * @description Checks if a property of a model is itself a model or has a model type
     * @summary Determines whether a specific property of a model instance is either a model instance
     * or has a type that is registered as a model. This function is used for model serialization
     * and deserialization to properly handle nested models.
     * @template M extends {@link Model}
     * @param {M} target - The model instance to check
     * @param {string} attribute - The property name to check
     * @return {boolean | string | undefined} Returns true if the property is a model instance,
     * the model name if the property has a model type, or undefined if not a model
     */
    static isPropertyModel<M extends Model>(
      target: M,
      attribute: string
    ): boolean | string | undefined;
  }
}
