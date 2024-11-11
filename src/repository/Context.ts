import { DataCache } from "./DataCache";
import { ContextArgs } from "./utils";
import { Contextual } from "../interfaces/Contextual";
import { NotFoundError } from "./errors";
import { OperationKeys } from "../operations/constants";
import { Constructor, Model } from "@decaf-ts/decorator-validation";

export class Context<M extends Model> extends DataCache {
  protected constructor(
    protected operation: OperationKeys,
    protected model?: Constructor<M>,
    protected parent?: Context<any>
  ) {
    super();
  }

  get timestamp() {
    return new Date();
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

  static async from<M extends Model, C extends Context<M>>(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    model: Constructor<M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...args: any[]
  ): Promise<C> {
    return new Context(operation, model) as C;
  }

  static async args<M extends Model>(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    model: Constructor<M>,
    args: any[],
    contextual?: Contextual<M>
  ): Promise<ContextArgs<M>> {
    const last = args.pop();

    async function getContext() {
      if (contextual) return contextual.context(operation, model, ...args);
      return new Context(operation, model);
    }

    let c: Context<M>;
    if (last) {
      if (last instanceof Context) {
        c = last;
        args.push(last);
      } else {
        c = await getContext();
        args.push(last, c);
      }
    } else {
      c = await getContext();
      args.push(c);
    }

    return { context: c, args: args };
  }
}
