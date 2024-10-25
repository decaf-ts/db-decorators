import { DataCache } from "./DataCache";
import { ContextArgs } from "./utils";
import { Contextual } from "../interfaces/Contextual";
import { NotFoundError } from "./errors";
import { OperationKeys } from "../operations/constants";
import { Constructor, Model } from "@decaf-ts/decorator-validation";

export class Context<M extends Model> extends DataCache {
  protected constructor(
    private operation: OperationKeys,
    private model?: Constructor<M>,
    private parent?: Context<any>
  ) {
    super();
  }

  async get(key: string): Promise<any> {
    try {
      return super.get(key);
    } catch (e: any) {
      if (this.parent) return this.parent.get(key);
      throw e;
    }
  }

  async pop(key: string): Promise<any> {
    if (key in this.cache) return super.pop(key);
    if (!this.parent) throw new NotFoundError(`Key ${key} not in dataStore`);
    return this.parent.pop(key);
  }

  child<N extends Model>(
    operation: OperationKeys,
    model?: Constructor<N>
  ): Context<N> {
    return this.constructor(operation, model, this);
  }

  static async from<M extends Model>(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    model: Constructor<M>
  ) {
    return new Context(operation, model);
  }

  static async args<M extends Model>(
    contextual: Contextual<M>,
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    model: Constructor<M>,
    args: any[]
  ): Promise<ContextArgs<M>> {
    const last = args.pop();
    let c: Context<M>;
    if (last) {
      if (last instanceof Context) {
        c = last;
        args.push(last);
      } else {
        c = await contextual.context(operation, model);
        args.push(last, c);
      }
    } else {
      c = await contextual.context(operation, model);
      args.push(c);
    }

    return { context: c, args: args };
  }
}
