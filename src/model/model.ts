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
     * @summary Compare object equality recursively
     * @param {any} obj object to compare to
     * @param {string} [exceptions] property names to be excluded from the comparison
     */
    equals(obj: any, ...exceptions: string[]): boolean;
    /**
     * @summary Returns the serialized model according to the currently defined {@link Serializer}
     */
    serialize(): string;
    /**
     * @summary Override the implementation for js's 'toString()' which sucks...
     * @override
     */
    toString(): string;
    /**
     * @summary Defines a default implementation for object hash. Relies on a very basic implementation based on Java's string hash;
     */
    hash(): string;
    /**
     * @summary Deserializes a Model
     * @param {string} str
     *
     * @param args
     * @throws {Error} If it fails to parse the string, or if it fails to build the model
     */
    static deserialize(str: string): any;
    /**
     * @summary Repopulates the Object properties with the ones from the new object
     * @description Iterates all common properties of obj (if existing) and self, and copies them onto self
     *
     * @param {T} self
     * @param {T | Record<string, any>} [obj]
     *
     */
    static fromObject<T extends Model>(
      self: T,
      obj?: T | Record<string, any>
    ): T;
    /**
     * @summary Repopulates the instance with the ones from the new Model Object
     * @description Iterates all common properties of obj (if existing) and self, and copies them onto self.
     * Is aware of nested Model Objects and rebuilds them also.
     * When List properties are decorated with {@link list}, they list items will also be rebuilt
     *
     * @param {T} self
     * @param {T | Record<string, any>} [obj]
     *
     */
    static fromModel<T extends Model>(
      self: T,
      obj?: T | Record<string, any>
    ): T;
    /**
     * @summary Sets the Global {@link ModelBuilderFunction}
     * @param {ModelBuilderFunction} [builder]
     */
    static setBuilder(builder?: ModelBuilderFunction): void;
    /**
     * @summary Retrieves the current global {@link ModelBuilderFunction}
     */
    static getBuilder(): ModelBuilderFunction | undefined;
    /**
     * Returns the current {@link ModelRegistryManager}
     *
     * @return ModelRegistry, defaults to {@link ModelRegistryManager}
     */
    private static getRegistry;
    /**
     * Returns the current actingModelRegistry
     *
     * @param {BuilderRegistry} modelRegistry the new implementation of Registry
     */
    static setRegistry(modelRegistry: BuilderRegistry<any>): void;
    /**
     * @summary register new Models
     * @param {any} constructor
     * @param {string} [name] when not defined, the name of the constructor will be used
     *
     * @see ModelRegistry
     */
    static register<T extends Model>(
      constructor: ModelConstructor<T>,
      name?: string
    ): void;
    /**
     * @summary Gets a registered Model {@link ModelConstructor}
     * @param {string} name
     *
     * @see ModelRegistry
     */
    static get<T extends Model>(name: string): ModelConstructor<T> | undefined;
    /**
     * @param {Record<string, any>} obj
     * @param {string} [clazz] when provided, it will attempt to find the matching constructor
     *
     * @throws Error If clazz is not found, or obj is not a {@link Model} meaning it has no {@link ModelKeys.ANCHOR} property
     *
     * @see ModelRegistry
     */
    static build<T extends Model>(obj?: Record<string, any>, clazz?: string): T;
    static getMetadata<V extends Model>(model: V): any;
    static getAttributes<V extends Model>(model: Constructor<V> | V): string[];
    static equals<V extends Model>(
      obj1: V,
      obj2: V,
      ...exceptions: any[]
    ): boolean;
    static hasErrors<V extends Model>(
      model: V,
      ...exceptions: any[]
    ): ModelErrorDefinition | undefined;
    static serialize<V extends Model>(model: V): any;
    static hash<V extends Model>(model: V): any;
    /**
     * @summary Builds the key to store as Metadata under Reflections
     * @description concatenates {@link ModelKeys#REFLECT} with the provided key
     * @param {string} str
     */
    static key(str: string): string;

    static isModel(target: Record<string, any>): boolean;
  }
}
