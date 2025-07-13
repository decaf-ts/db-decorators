import {
  Model,
  ModelErrorDefinition,
  validate,
} from "@decaf-ts/decorator-validation";

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
