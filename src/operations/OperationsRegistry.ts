import { OperationHandler } from "./types";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
import { Operations } from "./Operations";
import { Model } from "@decaf-ts/decorator-validation";

/**
 * @description Registry for database operation handlers
 * @summary Manages and stores operation handlers for different model properties and operations
 * @class OperationsRegistry
 * @template M - Model type
 * @template R - Repository type
 * @template V - Metadata type
 * @template F - Repository flags
 * @template C - Context type
 * @example
 * // Create a registry and register a handler
 * const registry = new OperationsRegistry();
 * registry.register(myHandler, OperationKeys.CREATE, targetModel, 'propertyName');
 *
 * // Get handlers for a specific operation
 * const handlers = registry.get(targetModel.constructor.name, 'propertyName', 'onCreate');
 *
 * @mermaid
 * classDiagram
 *   class OperationsRegistry {
 *     -cache: Record~string, Record~string|symbol, Record~string, Record~string, OperationHandler~~~~
 *     +get(target, propKey, operation, accum)
 *     +register(handler, operation, target, propKey)
 *   }
 */
export class OperationsRegistry {
  private readonly cache: Record<
    string,
    Record<
      string | symbol,
      Record<string, Record<string, OperationHandler<any, any, any>>>
    >
  > = {};

  /**
   * @description Retrieves operation handlers for a specific target and operation
   * @summary Finds all registered handlers for a given target, property, and operation, including from parent classes
   * @template M - Model type extending Model
   * @template R - Repository type extending IRepository
   * @template V - Metadata type
   * @param {string | Record<string, any>} target - The target class name or object
   * @param {string} propKey - The property key to get handlers for
   * @param {string} operation - The operation key to get handlers for
   * @param {OperationHandler[]} [accum] - Accumulator for recursive calls
   * @return {OperationHandler[] | undefined} Array of handlers or undefined if none found
   */
  get<M extends Model, R extends IRepository<M, any>, V>(
    target: string | Record<string, any>,
    propKey: string,
    operation: string,
    accum?: OperationHandler<M, R, V>[]
  ): OperationHandler<M, R, V>[] | undefined {
    accum = accum || [];
    let name;
    try {
      name = typeof target === "string" ? target : target.constructor.name;
      accum.unshift(
        ...Object.values(this.cache[name][propKey][operation] || [])
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      if (
        typeof target === "string" ||
        target === Object.prototype ||
        Object.getPrototypeOf(target) === Object.prototype
      )
        return accum;
    }

    let proto = Object.getPrototypeOf(target);
    if (proto.constructor.name === name) proto = Object.getPrototypeOf(proto);

    return this.get<M, R, V>(proto, propKey, operation, accum);
  }

  /**
   * @description Registers an operation handler for a specific target and operation
   * @summary Stores a handler in the registry for a given target, property, and operation
   * @template M - Model type extending Model
   * @template R - Repository type extending IRepository
   * @template V - Metadata type
   * @template F - Repository flags extending RepositoryFlags
   * @template C - Context type extending Context<F>
   * @param {OperationHandler} handler - The handler function to register
   * @param {OperationKeys} operation - The operation key to register the handler for
   * @param {M} target - The target model instance
   * @param {string | symbol} propKey - The property key to register the handler for
   * @return {void}
   */
  register<M extends Model, R extends IRepository<M, any>, V>(
    handler: OperationHandler<M, R, V>,
    operation: OperationKeys,
    target: M,
    propKey: string | symbol
  ): void {
    const name = target.constructor.name;
    const handlerName = Operations.getHandlerName(handler);

    if (!this.cache[name]) this.cache[name] = {};
    if (!this.cache[name][propKey]) this.cache[name][propKey] = {};
    if (!this.cache[name][propKey][operation])
      this.cache[name][propKey][operation] = {};
    if (this.cache[name][propKey][operation][handlerName]) return;
    this.cache[name][propKey][operation][handlerName] = handler;
  }
}
