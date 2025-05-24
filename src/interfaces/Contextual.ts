import { OperationKeys } from "../operations";
import { Context } from "../repository";
import { RepositoryFlags } from "../repository/types";

export interface Contextual<
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> {
  context(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    overrides: Partial<F>,
    ...args: any[]
  ): Promise<C>;
}
