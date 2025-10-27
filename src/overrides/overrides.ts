import {
  Model,
  ModelConditionalAsync,
  validate,
} from "@decaf-ts/decorator-validation";
import { validateCompare } from "../model/validation";
import { Constructor, Metadata } from "@decaf-ts/decoration";
import { DBKeys } from "../model/constants";

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

// Unfinished
(Model as any).pkDef = function <M extends Model>(
  model: Constructor<M>,
  property: keyof M = DBKeys.ID as keyof M
) {
  return Metadata.set(model, DBKeys.ID, property);
}.bind(Model);

// Unfinished
(Model as any).pk = function <M extends Model>(
  model: M,
  returnIdValue = false
) {
  if (!model) throw new Error("No model was provided");
  const idProp = Metadata.get(model.constructor as Constructor, DBKeys.ID);
  if (returnIdValue) return model[idProp as keyof M];
  return idProp;
}.bind(Model);
