import { required } from "@decaf-ts/decorator-validation";
import { readonly } from "../validation";
import { DBKeys } from "../model/constants";
import { propMetadata, apply, Metadata } from "@decaf-ts/decoration";

/**
 * @description Decorator that marks a property as an ID field
 * @summary Creates a composite decorator that marks a property as required, readonly, and as the ID field for database operations
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function id
 * @category Property Decorators
 */
export function id() {
  function idDecorator() {
    return function idDecorator(model: object, prop?: any) {
      return propMetadata(Metadata.key(DBKeys.ID, prop), {})(model, prop);
    };
  }

  return apply(required(), readonly(), idDecorator());
}
