import { ContextArgs } from "./utils";
import { Contextual, FlagsOf } from "../interfaces/Contextual";
import { OperationKeys } from "../operations/constants";
import { Model } from "@decaf-ts/decorator-validation";
import { DefaultRepositoryFlags } from "./constants";
import { ObjectAccumulator } from "typed-object-accumulator";
import {
  FlagsOfContext,
  LoggerOfContext,
  LoggerOfFlags,
  RepositoryFlags,
} from "./types";
import { Constructor } from "@decaf-ts/decoration";
import { Logging } from "@decaf-ts/logging";

/**
 * @description Factory type for creating context instances.
 * @summary Defines a function type that creates context instances with specific repository flags.
 * @template F - The repository flags type extending RepositoryFlags
 * @typedef {Function} ContextFactory
 * @memberOf module:db-decorators
 */
export type ContextFactory<C extends Context<any>> = (
  arg: Partial<Omit<FlagsOf<C>, "timestamp">>
) => C;

/**
 * @description Default factory for creating context instances.
 * @summary A factory function that creates new Context instances with the provided repository flags.
 * It automatically adds a timestamp to the context and returns a properly typed context instance.
 * @const DefaultContextFactory
 * @memberOf module:db-decorators
 */
export const DefaultContextFactory: ContextFactory<any> = <
  F extends RepositoryFlags<any>,
  C extends Context<F>,
>(
  arg: Partial<Omit<F, "timestamp">>
) => {
  return new Context<F>().accumulate(
    Object.assign({}, arg, {
      timestamp: new Date(),
      logger: arg.logger || Logging.get(),
    }) as F
  ) as C;
};

/**
 * @description A context management class for handling repository operations.
 * @summary The Context class provides a mechanism for managing repository operations with flags,
 * parent-child relationships, and state accumulation. It allows for hierarchical context chains
 * and maintains operation-specific configurations while supporting type safety through generics.
 *
 * @template F - Type extending RepositoryFlags that defines the context configuration
 *
 * @param {ObjectAccumulator<F>} cache - The internal cache storing accumulated values
 *
 * @class
 *
 * @example
 * ```typescript
 * // Creating a new context with repository flags
 * const context = new Context<RepositoryFlags>();
 *
 * // Accumulating values
 * const enrichedContext = context.accumulate({
 *   writeOperation: true,
 *   affectedTables: ['users'],
 *   operation: OperationKeys.CREATE
 * });
 *
 * // Accessing values
 * const isWrite = enrichedContext.get('writeOperation'); // true
 * const tables = enrichedContext.get('affectedTables'); // ['users']
 * ```
 *
 * @mermaid
 * sequenceDiagram
 *   participant C as Client
 *   participant Ctx as Context
 *   participant Cache as ObjectAccumulator
 *
 *   C->>Ctx: new Context()
 *   Ctx->>Cache: create cache
 *
 *   C->>Ctx: accumulate(value)
 *   Ctx->>Cache: accumulate(value)
 *   Cache-->>Ctx: updated cache
 *   Ctx-->>C: updated context
 *
 *   C->>Ctx: get(key)
 *   Ctx->>Cache: get(key)
 *   alt Key exists in cache
 *     Cache-->>Ctx: value
 *   else Key not found
 *     Ctx->>Ctx: check parent context
 *     alt Parent exists
 *       Ctx->>Parent: get(key)
 *       Parent-->>Ctx: value
 *     else No parent
 *       Ctx-->>C: throw error
 *     end
 *   end
 *   Ctx-->>C: requested value
 */
export class Context<F extends RepositoryFlags<any> = RepositoryFlags> {
  constructor() {
    Object.defineProperty(this, "cache", {
      value: new ObjectAccumulator<F>(),
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  static factory: ContextFactory<any> = DefaultContextFactory;

  readonly cache: RepositoryFlags<any> & ObjectAccumulator<any> =
    new ObjectAccumulator() as unknown as RepositoryFlags<any> &
      ObjectAccumulator<any>;

  /**
   * @description Accumulates new values into the context.
   * @summary Merges the provided value object with the existing context state,
   * creating a new immutable cache state.
   */
  accumulate<V extends object>(value: V): Context<F & V> {
    Object.defineProperty(this, "cache", {
      value: (this.cache as ObjectAccumulator<any>).accumulate(value),
      writable: false,
      enumerable: false,
      configurable: true,
    });
    return this as unknown as Context<F & V>;
  }

  get logger(): LoggerOfFlags<F> {
    return (this.cache as any).logger;
  }

  get timestamp() {
    return (this.cache as any).timestamp as F["timestamp"];
  }

  /**
   * @description Retrieves a value from the context by key.
   * @param {string} key
   * @return {any}
   */
  get<K extends keyof F>(key: K): F[K] {
    try {
      return (this.cache as ObjectAccumulator<any>).get(
        key as unknown as string
      ) as F[K];
    } catch (e: unknown) {
      const parent = (this.cache as any).parentContext as
        | Context<F>
        | undefined;
      if (parent) return parent.get(key);
      throw e;
    }
  }

  /**
   * @description Creates a child context from another context
   */
  static childFrom<C extends Context<any>>(
    context: C,
    overrides?: Partial<FlagsOf<C>>
  ): C {
    return Context.factory(
      Object.assign({}, (context as any).cache, overrides || {})
    ) as unknown as C;
  }

  /**
   * @description Creates a new context from operation parameters
   */
  static async from<M extends Model, C extends Context<any>>(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE
      | string,
    overrides: Partial<FlagsOfContext<C>>,
    model: Constructor<M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...args: any[]
  ): Promise<C> {
    return Context.factory(
      Object.assign({}, DefaultRepositoryFlags as RepositoryFlags, overrides, {
        operation: operation,
        model: model,
        logger: overrides.logger || (Logging.get() as LoggerOfContext<C>),
      })
    ) as C;
  }

  /**
   * @description Prepares arguments for context operations
   */
  static async args<M extends Model<any>, C extends Context<any>>(
    operation:
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE
      | string,
    model: Constructor<M>,
    args: any[],
    contextual?: Contextual<C>,
    overrides?: Partial<FlagsOf<C>>
  ): Promise<ContextArgs<C>> {
    const last = args.pop();

    async function getContext() {
      if (contextual)
        return contextual.context(operation, overrides || {}, model, ...args);
      return Context.from<M, C>(operation, overrides || {}, model, ...args);
    }

    let c: C;
    if (last) {
      if (last instanceof Context) {
        c = last as C;
        args.push(last);
      } else {
        args.push(last);
        c = (await getContext()) as C;
        args.push(c);
      }
    } else {
      c = (await getContext()) as C;
      args.push(c);
    }

    return { context: c, args: args as [...any[], C] };
  }
}
