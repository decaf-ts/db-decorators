import { OperationKeys } from "../operations";
import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { Context } from "../repository";

export interface Contextual<M extends Model> {
  context(operation: OperationKeys, model: Constructor<M>): Promise<Context<M>>;
}
