import { OperationKeys } from "../operations";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "../repository";

export interface Contextual<M extends Model> {
  context(operation: OperationKeys, ...args: any[]): Promise<Context<M>>;
}
