import { propMetadata, required } from "@decaf-ts/decorator-validation";
import { readonly } from "../validation";
import { DBKeys } from "../model/constants";
import { Repository } from "../repository";
import { Decoration } from "@decaf-ts/decorator-validation";

export function id() {
  const key = Repository.key(DBKeys.ID);
  return Decoration.for(key)
    .define(required(), readonly(), propMetadata(key, {}))
    .apply() as PropertyDecorator;
}
