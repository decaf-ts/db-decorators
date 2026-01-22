import { OperationHandler } from "./types";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
// import { Operations } from "./Operations";
import { Hashing, Model } from "@decaf-ts/decorator-validation";
import { Constructor, Decoration, Metadata } from "@decaf-ts/decoration";

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
      Record<
        string,
        Record<string, Record<string, OperationHandler<any, any, any>>>
      >
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
    const owner = this.resolveOwner(target);
    const name = this.resolveTargetName(target, owner);

    if (name) {
      const handlers = this.selectHandlers<M, R, V>(
        name,
        propKey,
        operation,
        owner
      );
      if (handlers?.length) {
        accum.unshift(...handlers);
      }
    } else if (
      typeof target === "string" ||
      target === Object.prototype ||
      Object.getPrototypeOf(target) === Object.prototype
    ) {
      return accum;
    }

    let proto = Object.getPrototypeOf(target);
    if (!proto) return accum;
    if (proto.constructor && proto.constructor.name === name)
      proto = Object.getPrototypeOf(proto);
    if (!proto) return accum;

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
    const handlerName = OperationsRegistry.getHandlerName(handler);
    const flavour = this.resolveFlavour(target.constructor as Constructor);

    if (!this.cache[name]) this.cache[name] = {};
    if (!this.cache[name][propKey]) this.cache[name][propKey] = {};
    if (!this.cache[name][propKey][operation])
      this.cache[name][propKey][operation] = {};
    if (!this.cache[name][propKey][operation][flavour])
      this.cache[name][propKey][operation][flavour] = {};
    if (this.cache[name][propKey][operation][flavour][handlerName]) return;
    this.cache[name][propKey][operation][flavour][handlerName] = handler;
  }

  private resolveOwner(
    target: string | Record<string, any>
  ): Constructor | undefined {
    if (!target || typeof target === "string") return undefined;
    if (typeof target === "function") return target as Constructor;
    return target.constructor as Constructor;
  }

  private resolveTargetName(
    target: string | Record<string, any>,
    owner?: Constructor
  ): string | undefined {
    if (typeof target === "string") return target;
    return owner?.name;
  }

  private resolveFlavour(target?: Constructor): string {
    if (!target) return Decoration.defaultFlavour;
    try {
      return Metadata.flavourOf(target);
    } catch {
      return Decoration.defaultFlavour;
    }
  }

  private selectHandlers<M extends Model, R extends IRepository<M, any>, V>(
    name: string,
    propKey: string,
    operation: string,
    owner?: Constructor
  ): OperationHandler<M, R, V>[] | undefined {
    const byOperation = this.cache[name]?.[propKey]?.[operation];
    if (!byOperation) return undefined;
    const flavour = this.resolveFlavour(owner);
    const bucket =
      byOperation[flavour] ||
      byOperation[Decoration.defaultFlavour] ||
      this.firstBucket(byOperation);
    if (!bucket) return undefined;
    const handlers = Object.values(bucket);
    return handlers.length
      ? (handlers as OperationHandler<M, R, V>[])
      : undefined;
  }

  private firstBucket(
    byOperation: Record<string, Record<string, OperationHandler<any, any, any>>>
  ): Record<string, OperationHandler<any, any, any>> | undefined {
    for (const handlers of Object.values(byOperation)) {
      if (handlers && Object.keys(handlers).length) return handlers;
    }
    return undefined;
  }

  /**
   * @description Gets a unique name for an operation handler
   * @summary Returns the name of the handler function or generates a hash if name is not available
   * @param {OperationHandler<any, any, any>} handler - The handler function to get the name for
   * @return {string} The name of the handler or a generated hash
   */
  static getHandlerName(handler: OperationHandler<any, any, any>) {
    if (handler.name) return handler.name;

    console.warn(
      "Handler name not defined. A name will be generated, but this is not desirable. please avoid using anonymous functions"
    );
    return Hashing.hash(handler.toString());
  }
}
