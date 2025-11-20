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

Model.prototype.toTransient = function toTransient<M extends Model>(
  this: M
): { model: M; transient?: Record<string, any> } {
  return Model.toTransient(this);
};

(Model as any).toTransient = function toTransient<M extends Model>(model: M) {
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
  return result as { model: M; transient?: Record<string, any> };
};

(Model as any).pk = function <M extends Model>(
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
}.bind(Model);

(Model as any).isTransient = function isTransient<M extends Model>(
  model: M | Constructor<M>
): boolean {
  return Metadata.isTransient(model);
}.bind(Model);

(Metadata as any).saveOperation = function <M extends Model>(
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

(Metadata as any).readOperation = function <M extends Model>(
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
