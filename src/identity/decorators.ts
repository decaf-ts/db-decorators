import { propMetadata, required } from "@decaf-ts/decorator-validation";
import { readonly } from "../validation";
import { DBKeys } from "../model/constants";
import { Repository } from "../repository";
import { apply } from "@decaf-ts/reflection";

/**
 * @description Decorator that marks a property as an ID field
 * @summary Creates a composite decorator that marks a property as required, readonly, and as the ID field for database operations
 * @return {PropertyDecorator} A decorator that can be applied to class properties
 * @function id
 * @category Property Decorators
 */
export function id() {
  return apply(
    required(),
    readonly(),
    propMetadata(Repository.key(DBKeys.ID), {})
  );
}
