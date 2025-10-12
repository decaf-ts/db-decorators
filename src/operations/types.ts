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
