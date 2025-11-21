import { OperationKeys } from "./constants";
import { ContextOf, IRepository } from "../interfaces/IRepository";
import { Model } from "@decaf-ts/decorator-validation";

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
  R extends IRepository<M, any>,
  V = object,
> =
  | StandardOperationHandler<M, R, V>
  | UpdateOperationHandler<M, R, V>
  | IdOperationHandler<M, R, V>
  | GroupOperationHandler<M, R, V>
  | GroupUpdateOperationHandler<M, R, V>;

export type StandardOperationHandler<
  M extends Model,
  R extends IRepository<M, any>,
  V = object,
> = (
  this: R,
  context: ContextOf<R>,
  metadata: V,
  key: keyof M,
  model: M
) => Promise<void> | void;

export type IdOperationHandler<
  M extends Model,
  R extends IRepository<M, any>,
  V = object,
> = (
  this: R,
  context: ContextOf<R>,
  decorator: V,
  key: keyof M,
  id: string
) => Promise<void> | void;

export type UpdateOperationHandler<
  M extends Model,
  R extends IRepository<M, any>,
  V = object,
> = (
  this: R,
  context: ContextOf<R>,
  decorator: V,
  key: keyof M,
  model: M,
  oldModel: M
) => Promise<void> | void;

export type GroupOperationHandler<
  M extends Model,
  R extends IRepository<M, any>,
  V = object,
> = (
  this: R,
  context: ContextOf<R>,
  metadata: V[],
  keys: (keyof M)[],
  model: M
) => Promise<void> | void;

export type GroupUpdateOperationHandler<
  M extends Model,
  R extends IRepository<M, any>,
  V = object,
> = (
  this: R,
  context: ContextOf<R>,
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
  R extends IRepository<M, any>,
  V = object,
> = StandardOperationHandler<M, R, V> | GroupOperationHandler<M, R, V>;

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
  R extends IRepository<M, any>,
  V = object,
> = UpdateOperationHandler<M, R, V> | GroupUpdateOperationHandler<M, R, V>;
