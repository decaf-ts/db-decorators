import { propMetadata, required } from "@decaf-ts/decorator-validation";
import { readonly } from "../validation";
import { DBKeys } from "../model/constants";
import { Repository } from "../repository";
import { apply } from "@decaf-ts/reflection";

export function id() {
  return apply(
    required(),
    readonly(),
    propMetadata(Repository.key(DBKeys.ID), {})
  );
}
