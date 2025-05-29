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

export type OperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> =
  | StandardOperationHandler<M, R, V, F, C>
  | UpdateOperationHandler<M, R, V, F, C>
  | IdOperationHandler<M, R, V, F, C>;

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
