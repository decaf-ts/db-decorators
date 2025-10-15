import { required } from "@decaf-ts/decorator-validation";
import { readonly } from "../validation";
import { DBKeys } from "../model/constants";
import { propMetadata, apply } from "@decaf-ts/decoration";

/**
 * @description Decorator that marks a property as an ID field
 * @summary Creates a composite decorator that marks a property as required, readonly, and as the ID field for database operations
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function id
 * @category Property Decorators
 */
export function id() {
  return apply(required(), readonly(), propMetadata(DBKeys.ID, {}));
}
