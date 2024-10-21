import { propMetadata, required } from "@decaf-ts/decorator-validation";
import { apply } from "@decaf-ts/reflection";
import { readonly } from "../validation";
import { DBKeys } from "../model/constants";
import { Repository } from "../repository";
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import * as Validation from "../validation/validation";

export function id() {
  return apply(
    required(),
    readonly(),
    propMetadata(Repository.key(DBKeys.ID), {})
  );
}
