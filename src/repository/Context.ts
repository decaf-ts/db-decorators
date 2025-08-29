import { ContextArgs } from "./utils";
import { Contextual } from "../interfaces/Contextual";
import { OperationKeys } from "../operations/constants";
import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { DefaultRepositoryFlags } from "./constants";
import { ObjectAccumulator } from "typed-object-accumulator";
import { RepositoryFlags } from "./types";

/**
 * @description Factory type for creating context instances.
 * @summary Defines a function type that creates context instances with specific repository flags.
 * @template F - The repository flags type extending RepositoryFlags
 * @typedef {Function} ContextFactory
 * @memberOf module:db-decorators
 */
export type ContextFactory<F extends RepositoryFlags> = <C extends Context<F>>(
  arg: Omit<F, "timestamp">
) => C;

/**
 * @description Default factory for creating context instances.
 * @summary A factory function that creates new Context instances with the provided repository flags.
 * It automatically adds a timestamp to the context and returns a properly typed context instance.
 * @const DefaultContextFactory
 * @memberOf module:db-decorators
 */
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
export class Context<F extends RepositoryFlags> {
  constructor() {
    Object.defineProperty(this, "cache", {
      value: new ObjectAccumulator<F>(),
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  static factory: ContextFactory<any> = DefaultContextFactory;

  private readonly cache: F & ObjectAccumulator<F> =
    new ObjectAccumulator() as F & ObjectAccumulator<F>;

  /**
   * @description Accumulates new values into the context.
   * @summary Merges the provided value object with the existing context state,
   * creating a new immutable cache state.
   *
   * @template F - current accumulator type
   * @template V - Type extending object for the values to accumulate
   * @param {V} value - The object containing values to accumulate
   * @returns A new context instance with accumulated values
   */
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

  /**
   * @description Retrieves a value from the context by key.
   * @summary Attempts to get a value from the current context's cache.
   * If not found, traverses up the parent context chain.
   *
   * @template K - Type extending keyof F for the key to retrieve
   * @template F - Accumulator type
   * @param {K} key - The key to retrieve from the context
   * @returns The value associated with the key
   * @throws {Error} If the key is not found in the context chain
   */
  get<K extends keyof F>(key: K): F[K] {
    try {
      return this.cache.get(key);
    } catch (e: unknown) {
      if (this.cache.parentContext) return this.cache.parentContext.get(key);
      throw e;
    }
  }

  /**
   * @description Creates a child context
   * @summary Generates a new context instance with current context as parent
   *
   * @template M - Type extending Model
   * @param {OperationKeys} operation - The operation type
   * @param {Constructor<M>} [model] - Optional model constructor
   * @returns {C} New child context instance
   */
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

  /**
   * @description Creates a child context from another context
   * @summary Generates a new context instance with parent reference
   *
   * @template F - Type extending Repository Flags
   * @template C - Type extending Context<F>
   * @param {C} context - The parent context
   * @param {Partial<F>} [overrides] - Optional flag overrides
   * @returns {C} New child context instance
   */
  static childFrom<F extends RepositoryFlags, C extends Context<F>>(
    context: C,
    overrides?: Partial<F>
  ): C {
    return Context.factory(
      Object.assign({}, context.cache, overrides || {})
    ) as unknown as C;
  }

  /**
   * @description Creates a new context from operation parameters
   * @summary Generates a context instance for specific operation
   *
   * @template F - Type extending Repository Flags
   * @template M - Type extending Model
   * @param {OperationKeys.DELETE} operation - The operation type
   * @param {Partial<F>} overrides - Flag overrides
   * @param {Constructor<M>} model - The model constructor
   * @param {any} args - Operation arguments
   * @returns {Promise<C>} Promise resolving to new context
   */
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

  /**
   * @description Prepares arguments for context operations
   * @summary Creates a context args object with the specified operation parameters
   *
   * @template F - Type extending {@link RepositoryFlags}
   * @template M - Type extending {@link Model}
   * @param {OperationKeys.DELETE} operation - The operation type
   * @param {Constructor<M>} model - The model constructor
   * @param {any[]} args - Operation arguments
   * @param {Contextual<F>} [contextual] - Optional contextual object
   * @param {Partial<F>} [overrides] - Optional flag overrides
   * @returns {Promise<ContextArgs>} Promise resolving to context arguments
   *
   * @mermaid
   * sequenceDiagram
   *   participant C as Context
   *   participant M as Model
   *   participant A as Args
   *
   *   C->>C: Receive operation request
   *   C->>M: Validate model constructor
   *   C->>C: Create child context
   *   C->>A: Process operation args
   *   A->>C: Return context args
   *   C->>C: Apply overrides
   *   C->>C: Return final context
   */
  static async args<
    M extends Model<any>,
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
        args.push(last);
        c = (await getContext()) as C;
        args.push(c);
      }
    } else {
      c = (await getContext()) as C;
      args.push(c);
    }

    return { context: c, args: args };
  }
}
