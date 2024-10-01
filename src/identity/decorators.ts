import { required } from "@decaf-ts/decorator-validation";
import { apply, metadata } from "@decaf-ts/reflection";
import { getDBKey } from "../model/decorators";
import { readonly } from "../validation/decorators";
import { DBKeys } from "../model/constants";

export function id() {
  return apply(required(), readonly(), metadata(getDBKey(DBKeys.ID), {}));
}
