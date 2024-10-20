import {
  Comparable,
  Hashable,
  ModelArg,
  ModelErrorDefinition,
  Serializable,
  Validatable,
  Model,
  validate,
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

declare global {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  export declare abstract class Model
    implements Validatable, Serializable, Hashable, Comparable<Model>
  {
    protected constructor(arg?: ModelArg<Model>);

    hasErrors(...exclusions: any[]): ModelErrorDefinition | undefined;
    hasErrors(
      previousVersion?: Model | any,
      ...exclusions: any[]
    ): ModelErrorDefinition | undefined;
  }
}
