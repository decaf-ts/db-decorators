import { OperationKeys } from "../operations";
import { Context } from "../repository";
import { RepositoryFlags } from "../repository/types";

export interface Contextual<F extends RepositoryFlags> {
  context<C extends Context<F> = Context<F>>(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    ...args: any[]
  ): Promise<C>;
}
