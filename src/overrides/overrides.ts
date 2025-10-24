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
(Metadata as any).pk = function <M extends Model>(model: Constructor<M>) {
  return Object.keys(Metadata.get(model, DBKeys.ID))[0];
}.bind(Metadata);

// Unfinished
(Metadata as any).pkDef = function <M extends Model>(
  model: Constructor<M>,
  property: keyof M
) {
  return Metadata.set(model.constructor as Constructor, DBKeys.ID, property);
}.bind(Metadata);
