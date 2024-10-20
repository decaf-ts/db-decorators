import { propMetadata, required } from "@decaf-ts/decorator-validation";
import { apply, metadata } from "@decaf-ts/reflection";
import { readonly } from "../validation/decorators";
import { DBKeys } from "../model/constants";
import { Repository } from "../repository";

export function id() {
  return apply(
    required(),
    readonly(),
    propMetadata(Repository.key(DBKeys.ID), {})
  );
}
