import { OperationKeys } from "../operations";
import { Context } from "../repository";

export type FlagsOf<C extends Context<any>> =
  C extends Context<infer T> ? T : never;

/**
 * @description Interface for context-aware operations
 * @summary Provides context management for database operations
 * @template F - Type extending RepositoryFlags, defaults to RepositoryFlags
 * @template C - Type extending Context<F>, defaults to Context<F>
 * @interface Contextual
 * @memberOf module:db-decorators
 */
export interface Contextual<C extends Context<any> = Context<any>> {
  /**
   * @description Creates a context for a specific operation
   * @summary Generates an operation-specific context with custom flags
   * @param {(OperationKeys.CREATE|OperationKeys.READ|OperationKeys.UPDATE|OperationKeys.DELETE)} operation - The operation type
   * @template F - Type extending RepositoryFlags, defaults to RepositoryFlags
   * @param {Partial<F>} overrides - Custom flag overrides for this context
   * @param {...any[]} args - Additional arguments
   * @return {Promise<C>} Promise resolving to the created context
   */
  context(
    operation:
      | ((...args: any[]) => any)
      | OperationKeys.CREATE
      | OperationKeys.READ
      | OperationKeys.UPDATE
      | OperationKeys.DELETE
      | string,
    overrides: Partial<FlagsOf<C>>,
    ...args: any[]
  ): Promise<C>;
}
