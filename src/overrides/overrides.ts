import {
  Model,
  ModelConditionalAsync,
  validate,
} from "@decaf-ts/decorator-validation";
import { validateCompare } from "../model/validation";
import { Constructor, Metadata } from "@decaf-ts/decoration";
import { DBKeys } from "../model/constants";
import { ModelOperations } from "../operations/constants";
import { SerializationError } from "../repository/errors";
import { ComposedFromMetadata } from "../model/decorators";
import { Context } from "../repository/index";

Model.prototype.isTransient = function (): boolean {
  return Metadata.isTransient(this);
};

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
Model.prototype.hasErrors = function <M extends Model<true | false>>(
  this: M,
  previousVersion?: M | any,
  ...exclusions: any[]
): ModelConditionalAsync<M> {
  if (previousVersion && !(previousVersion instanceof Model)) {
    exclusions.unshift(previousVersion);
    previousVersion = undefined;
  }

  const async = this.isAsync();
  const errs = validate(this, async, ...exclusions);

  if (async) {
    return Promise.resolve(errs).then((resolvedErrs) => {
      if (resolvedErrs || !previousVersion) {
        return resolvedErrs;
      }
      return validateCompare(previousVersion, this, async, ...exclusions);
    }) as any;
  }

  if (errs || !previousVersion) return errs as any;

  // @ts-expect-error Overriding Model prototype method with dynamic conditional return type.
  return validateCompare(previousVersion, this, async, ...exclusions);
};

Model.prototype.segregate = function segregate<M extends Model>(
  this: M
): { model: M; transient?: Record<keyof M, M[keyof M]> } {
  return Model.segregate(this);
};

(Model as any).segregate = function segregate<M extends Model>(
  model: M
): { model: M; transient?: Record<keyof M, M[keyof M]> } {
  if (!Metadata.isTransient(model)) return { model: model };
  const decoratedProperties = Metadata.validatableProperties(
    model.constructor as any
  );

  const transientProps = Metadata.get(
    model.constructor as any,
    DBKeys.TRANSIENT
  );

  const result = {
    model: {} as Record<string, any>,
    transient: {} as Record<string, any>,
  };
  for (const key of decoratedProperties) {
    const isTransient = Object.keys(transientProps).includes(key);
    if (isTransient) {
      result.transient = result.transient || {};
      try {
        result.transient[key] = model[key as keyof M];
      } catch (e: unknown) {
        throw new SerializationError(
          `Failed to serialize transient property ${key}: ${e}`
        );
      }
    } else {
      result.model = result.model || {};
      result.model[key] = (model as Record<string, any>)[key];
    }
  }

  result.model = Model.build(result.model, model.constructor.name);
  return result as { model: M; transient?: Record<keyof M, M[keyof M]> };
};

(Metadata as any).pk = function pk<M extends Model>(
  model: M | Constructor<M>,
  keyValue = false
) {
  if (!model) throw new Error("No model was provided");
  const constr = model instanceof Model ? model.constructor : model;
  const idProp = Metadata.get(constr as Constructor, DBKeys.ID);
  if (!idProp) {
    throw new Error(
      `No Id property defined for model ${constr?.name || "Unknown Model"}`
    );
  }
  const key = Object.keys(idProp)[0] as keyof M;
  if (!keyValue) return key;
  if (model instanceof Model) return model[key as keyof M];
  throw new Error("Cannot get the value of the pk from the constructor");
}.bind(Metadata);

(Model as any).pk = function pk<M extends Model>(
  model: M | Constructor<M>,
  keyValue = false
) {
  return Metadata.pk(model, keyValue);
}.bind(Model);

(Model as any).pkProps = function pkProps<M extends Model>(
  model: Constructor<M>
): any {
  return Metadata.get(
    model,
    Metadata.key(DBKeys.ID, Model.pk(model) as string)
  );
}.bind(Model);

(Model as any).isTransient = function isTransient<M extends Model>(
  model: M | Constructor<M>
): boolean {
  return !!Metadata.get(
    typeof model !== "function" ? (model.constructor as any) : model,
    DBKeys.TRANSIENT
  );
}.bind(Model);

(Model as any).composed = function composed<M extends Model<boolean>>(
  model: Constructor<M> | M,
  prop?: keyof M
): boolean | ComposedFromMetadata | undefined {
  const constr =
    model instanceof Model ? (model.constructor as Constructor<M>) : model;
  if (prop)
    return Metadata.get(constr, Metadata.key(DBKeys.COMPOSED, prop as string));
  return !!Metadata.get(constr, DBKeys.COMPOSED);
}.bind(Model);

/**
 * @description Merges two model instances into a new instance.
 * @summary Creates a new model instance by combining properties from an old model and a new model.
 * Properties from the new model override properties from the old model if they are defined.
 * @template {M} - Type extending Model
 * @param {M} oldModel - The original model instance
 * @param {M} model - The new model instance with updated properties
 * @return {M} A new model instance with merged properties
 */
(Model as any).merge = function merge<M extends Model>(
  oldModel: M,
  newModel: M,
  constructor?: Constructor<M>
): M {
  constructor = constructor || (oldModel.constructor as Constructor<M>);
  const extractData = (model: M) =>
    Object.entries(model).reduce((accum: Record<string, any>, [key, val]) => {
      if (typeof val !== "undefined" && val !== null) accum[key] = val;
      return accum;
    }, {});

  const data = Object.assign({}, extractData(oldModel), extractData(newModel));
  return new constructor(data);
}.bind(Model);

(Metadata as any).saveOperation = function saveOperation<M extends Model>(
  model: Constructor<M>,
  propertyKey: string,
  operation: string,
  metadata: any
) {
  if (!propertyKey) return;
  Metadata.set(
    model,
    Metadata.key(ModelOperations.OPERATIONS, propertyKey, operation),
    metadata
  );
}.bind(Metadata);

(Metadata as any).readOperation = function readOperation<M extends Model>(
  model: Constructor<M>,
  propertyKey?: string,
  operation?: string
) {
  if (!propertyKey || !operation) return;
  return Metadata.get(
    model,
    Metadata.key(ModelOperations.OPERATIONS, propertyKey, operation)
  );
}.bind(Metadata);

(Metadata as any).isTransient = function isTransient<M extends Model>(
  model: M | Constructor<M>
): boolean {
  return !!Metadata.get(
    typeof model !== "function" ? (model.constructor as any) : model,
    DBKeys.TRANSIENT
  );
}.bind(Metadata);

(Model as any).generated = function generated<M extends Model>(
  model: M | Constructor<M>,
  prop: keyof M
): boolean | string {
  return !!Metadata.get(
    typeof model !== "function" ? (model.constructor as any) : model,
    Metadata.key(DBKeys.GENERATED, prop as string)
  );
}.bind(Model);

(Model as any).shouldGenerate = function shouldGenerate<M extends Model>(
  model: M,
  prop: keyof M,
  ctx: Context<any>
): boolean {
  if (ctx.get("allowGenerationOverride") && typeof model[prop] !== "undefined")
    return false;
  return true;
}.bind(Model);
