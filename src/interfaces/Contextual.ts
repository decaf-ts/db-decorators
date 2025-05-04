import { OperationKeys } from "../operations";
import { Context, RepositoryFlags } from "../repository";

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
