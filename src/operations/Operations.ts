import { Hashing, Model } from "@decaf-ts/decorator-validation";
import { OperationHandler } from "./types";
import { OperationsRegistry } from "./OperationsRegistry";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces";
import { Context } from "../repository";
import { RepositoryFlags } from "../repository/types";

/**
 * @description Static utility class for database operation management
 * @summary Provides functionality for registering, retrieving, and managing database operation handlers
 * @class Operations
 * @template M - Model type
 * @template R - Repository type
 * @template V - Metadata type
 * @template F - Repository flags
 * @template C - Context type
 * @example
 * // Register a handler for a create operation
 * Operations.register(myHandler, OperationKeys.CREATE, targetModel, 'propertyName');
 * 
 * // Get handlers for a specific operation
 * const handlers = Operations.get(targetModel.constructor.name, 'propertyName', 'onCreate');
 * 
 * @mermaid
 * classDiagram
 *   class Operations {
 *     -registry: OperationsRegistry
 *     +getHandlerName(handler)
 *     +key(str)
 *     +get(targetName, propKey, operation)
 *     -getOpRegistry()
 *     +register(handler, operation, target, propKey)
 *   }
 *   Operations --> OperationsRegistry : uses
 */
export class Operations {
  private static registry: OperationsRegistry;

  private constructor() {}

  /**
   * @description Gets a unique name for an operation handler
   * @summary Returns the name of the handler function or generates a hash if name is not available
   * @param {OperationHandler<any, any, any, any, any>} handler - The handler function to get the name for
   * @return {string} The name of the handler or a generated hash
   */
  static getHandlerName(handler: OperationHandler<any, any, any, any, any>) {
    if (handler.name) return handler.name;

    console.warn(
      "Handler name not defined. A name will be generated, but this is not desirable. please avoid using anonymous functions"
    );
    return Hashing.hash(handler.toString());
  }

  /**
   * @description Generates a reflection metadata key
   * @summary Creates a fully qualified metadata key by prefixing with the reflection namespace
   * @param {string} str - The operation key string to prefix
   * @return {string} The fully qualified metadata key
   */
  static key(str: string) {
    return OperationKeys.REFLECT + str;
  }

  /**
   * @description Retrieves operation handlers for a specific target and operation
   * @summary Gets registered handlers from the operations registry for a given target, property, and operation
   * @template M - Model type extending Model
   * @template R - Repository type extending IRepository
   * @template V - Metadata type, defaults to object
   * @template F - Repository flags extending RepositoryFlags
   * @template C - Context type extending Context<F>
   * @param {string | Record<string, any>} targetName - The target class name or object
   * @param {string} propKey - The property key to get handlers for
   * @param {string} operation - The operation key to get handlers for
   * @return {any} The registered handlers for the specified target, property, and operation
   */
  static get<
    M extends Model,
    R extends IRepository<M, F, C>,
    V = object,
    F extends RepositoryFlags = RepositoryFlags,
    C extends Context<F> = Context<F>,
  >(
    targetName: string | Record<string, any>,
    propKey: string,
    operation: string
  ) {
    return Operations.registry.get<M, R, V, F, C>(
      targetName,
      propKey,
      operation
    );
  }

  /**
   * @description Gets or initializes the operations registry
   * @summary Returns the existing registry or creates a new one if it doesn't exist
   * @return {OperationsRegistry} The operations registry instance
   * @private
   */
  private static getOpRegistry() {
    if (!Operations.registry) Operations.registry = new OperationsRegistry();
    return Operations.registry;
  }

  /**
   * @description Registers an operation handler for a specific target and operation
   * @summary Adds a handler to the operations registry for a given target, property, and operation
   * @template V - Model type extending Model
   * @param {OperationHandler<V, any, any>} handler - The handler function to register
   * @param {OperationKeys} operation - The operation key to register the handler for
   * @param {V} target - The target model instance
   * @param {string | symbol} propKey - The property key to register the handler for
   * @return {void}
   */
  static register<V extends Model>(
    handler: OperationHandler<V, any, any>,
    operation: OperationKeys,
    target: V,
    propKey: string | symbol
  ) {
    Operations.getOpRegistry().register(
      handler as any,
      operation,
      target,
      propKey
    );
  }
}
