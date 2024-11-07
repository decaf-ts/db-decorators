import { OperationKeys } from "../operations";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "../repository";

export interface Contextual<M extends Model> {
  context<C extends Context<M> = Context<M>>(
    operation: OperationKeys,
    ...args: any[]
  ): Promise<C>;
}
