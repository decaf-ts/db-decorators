import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "../repository/Context";
import { RepositoryFlags } from "../repository/types";

/**
 * @description Metadata for database operations
 * @summary Contains information about an operation, its handler, and associated metadata
 * @template V - Type of the metadata
 * @typedef {Object} OperationMetadata
 * @property {OperationKeys} operation - The type of operation
 * @property {string} handler - The name of the handler function
 * @property {V} [metadata] - Optional metadata associated with the operation
 * @memberOf module:db-decorators
 */
export type OperationMetadata<V> = {
  operation: OperationKeys;
  handler: string;
  metadata?: V;
};

/**
 * @description Union type for all operation handler types
 * @summary Represents any type of operation handler function that can be used with database operations
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {(StandardOperationHandler<M, R, V, F, C> | UpdateOperationHandler<M, R, V, F, C> | IdOperationHandler<M, R, V, F, C>)} OperationHandler
 * @memberOf module:db-decorators
 */
export type OperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> =
  | StandardOperationHandler<M, R, V, F, C>
  | UpdateOperationHandler<M, R, V, F, C>
  | IdOperationHandler<M, R, V, F, C>
  | GroupOperationHandler<M, R, V, F, C>
  | GroupUpdateOperationHandler<M, R, V, F, C>;

/**
 * @description Handler type for standard database operations
 * @summary Function signature for handlers that process standard operations like create and read
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} StandardOperationHandler
 * @param {R} this - The repository instance (this context)
 * @param {C} context - The operation context
 * @param {V} metadata - Metadata associated with the operation
 * @param {keyof M} key - The property key being operated on
 * @param {M} model - The model instance being operated on
 * @return {Promise<void> | void} Nothing or a Promise resolving to nothing
 * @memberOf module:db-decorators
 */
export type StandardOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> = (
  this: R,
  context: C,
  metadata: V,
  key: keyof M,
  model: M
) => Promise<void> | void;

/**
 * @description Handler type for ID-based database operations
 * @summary Function signature for handlers that process operations using only an ID (like read by ID)
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} IdOperationHandler
 * @param {R} this - The repository instance (this context)
 * @param {C} context - The operation context
 * @param {V} decorator - Metadata associated with the operation
 * @param {keyof M} key - The property key being operated on
 * @param {string} id - The ID of the model being operated on
 * @return {Promise<void> | void} Nothing or a Promise resolving to nothing
 * @memberOf module:db-decorators
 */
export type IdOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> = (
  this: R,
  context: C,
  decorator: V,
  key: keyof M,
  id: string
) => Promise<void> | void;

/**
 * @description Handler type for update database operations
 * @summary Function signature for handlers that process update operations with both new and old model states
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} UpdateOperationHandler
 * @param {R} this - The repository instance (this context)
 * @param {C} context - The operation context
 * @param {V} decorator - Metadata associated with the operation
 * @param {keyof M} key - The property key being operated on
 * @param {M} model - The new model instance after update
 * @param {M} oldModel - The original model instance before update
 * @return {Promise<void> | void} Nothing or a Promise resolving to nothing
 * @memberOf module:db-decorators
 */
export type UpdateOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> = (
  this: R,
  context: C,
  decorator: V,
  key: keyof M,
  model: M,
  oldModel: M
) => Promise<void> | void;

/**
 * @description Handler type for standard database operations
 * @summary Function signature for handlers that process standard operations like create and read
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} StandardOperationHandler
 * @param {R} this - The repository instance (this context)
 * @param {C} context - The operation context
 * @param {V} metadata - Metadata associated with the operation
 * @param {keyof M} key - The property key being operated on
 * @param {M} model - The model instance being operated on
 * @return {Promise<void> | void} Nothing or a Promise resolving to nothing
 * @memberOf module:db-decorators
 */
export type GroupOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> = (
  this: R,
  context: C,
  metadata: V[],
  keys: (keyof M)[],
  model: M
) => Promise<void> | void;

/**
 * @description Handler type for grouped update database operations
 * @summary Function signature for handlers that process update operations with both new and old model states
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} GroupUpdateOperationHandler
 * @param {R} this - The repository instance (this context)
 * @param {C} context - The operation context
 * @param {V} metadata - Metadata associated with the operation
 * @param {keyof M} keys - The property key being operated on
 * @param {M} model - The model instance being operated on
 * @return {Promise<void> | void} Nothing or a Promise resolving to nothing
 * @memberOf module:db-decorators
 */
export type GroupUpdateOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> = (
  this: R,
  context: C,
  decorator: V[],
  keys: (keyof M)[],
  model: M,
  oldModel: M
) => Promise<void> | void;

/**
 * @description General handler type for database operations
 * @summary Function signature for handlers that process operations like create and read
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} GeneralOperationHandler
 * @return {Promise<void> | void} Nothing or a Promise resolving to nothing
 * @memberOf module:db-decorators
 */
export type GeneralOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> =
  | StandardOperationHandler<M, R, V, F, C>
  | GroupOperationHandler<M, R, V, F, C>;

/**
 * @description General handler type for group update database operations
 * @summary Function signature for handlers that process update operations with both new and old model states
 * @template M - Model type extending Model
 * @template R - Repository type extending IRepository
 * @template V - Metadata type, defaults to object
 * @template F - Repository flags extending RepositoryFlags
 * @template C - Context type extending Context<F>
 * @typedef {Function} GeneralUpdateOperationHandler
 * @memberOf module:db-decorators
 */
export type GeneralUpdateOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> =
  | UpdateOperationHandler<M, R, V, F, C>
  | GroupUpdateOperationHandler<M, R, V, F, C>;
