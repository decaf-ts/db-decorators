import { ContextArgs } from "./utils";
import { Contextual } from "../interfaces/Contextual";
import { OperationKeys } from "../operations/constants";
import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { DefaultRepositoryFlags } from "./constants";
import { ObjectAccumulator } from "typed-object-accumulator";
import { RepositoryFlags } from "./types";

export type ContextFactory<F extends RepositoryFlags> = <C extends Context<F>>(
  arg: Omit<F, "timestamp">
) => C;

export const DefaultContextFactory: ContextFactory<any> = <
  F extends RepositoryFlags,
  C extends Context<F>,
>(
  arg: Omit<F, "timestamp">
) => {
  return new Context<F>().accumulate(
    Object.assign({}, arg, { timestamp: new Date() }) as F
  ) as C;
};

export class Context<F extends RepositoryFlags = RepositoryFlags> {
  static factory: ContextFactory<any> = DefaultContextFactory;

  private readonly cache: F & ObjectAccumulator<F> =
    new ObjectAccumulator() as F & ObjectAccumulator<F>;

  constructor(obj?: F) {
    if (obj) return this.accumulate(obj);
  }

  accumulate<V extends object>(value: V) {
    Object.defineProperty(this, "cache", {
      value: this.cache.accumulate(value),
      writable: false,
      enumerable: false,
      configurable: true,
    });
    return this as unknown as Context<F & V>;
  }

  get timestamp() {
    return this.cache.timestamp;
  }

  get<K extends keyof F>(key: K): F[K] {
    try {
      return this.cache.get(key);
    } catch (e: unknown) {
      if (this.cache.parentContext) return this.cache.parentContext.get(key);
      throw e;
    }
  }

  child<M extends Model, C extends Context<F>>(
    operation: OperationKeys,
    model?: Constructor<M>
  ): C {
    return Context.childFrom<F, C>(
      this as unknown as C,
      {
        operation: operation,
        affectedTables: model ? [model] : [],
      } as unknown as Partial<F>
    );
  }

  static childFrom<F extends RepositoryFlags, C extends Context<F>>(
    context: C,
    overrides?: Partial<F>
  ): C {
    return Context.factory(
      Object.assign({}, context.cache, overrides || {})
    ) as unknown as C;
  }

  static async from<
    M extends Model,
    F extends RepositoryFlags,
    C extends Context<F>,
  >(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    overrides: Partial<F>,
    model: Constructor<M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...args: any[]
  ): Promise<C> {
    return Context.factory(
      Object.assign({}, DefaultRepositoryFlags, overrides, {
        operation: operation,
        model: model,
      })
    ) as C;
  }

  static async args<
    M extends Model,
    C extends Context<F>,
    F extends RepositoryFlags,
  >(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE,
    model: Constructor<M>,
    args: any[],
    contextual?: Contextual<F>,
    overrides?: Partial<F>
  ): Promise<ContextArgs<F, C>> {
    const last = args.pop();

    async function getContext() {
      if (contextual)
        return contextual.context(operation, overrides || {}, model, ...args);
      return Context.from(operation, overrides || {}, model, ...args);
    }

    let c: C;
    if (last) {
      if (last instanceof Context) {
        c = last as C;
        args.push(last);
      } else {
        c = (await getContext()) as C;
        args.push(last, c);
      }
    } else {
      c = (await getContext()) as C;
      args.push(c);
    }

    return { context: c, args: args };
  }
}
