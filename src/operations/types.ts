import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "../repository/Context";
import { RepositoryFlags } from "../repository";

export type OperationMetadata<V> = {
  operation: OperationKeys;
  handler: string;
  metadata?: V;
};

/**
 * @typedef OperationHandler
 * @memberOf db-decorators.operations
 */
export type OperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V extends object = object,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> =
  | StandardOperationHandler<M, R, V, F, C>
  | UpdateOperationHandler<M, R, V, F, C>
  | IdOperationHandler<M, R, V, F, C>;

/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type StandardOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V extends object = object,
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
 * @typedef IdOperationHandler
 * @memberOf db-decorators.operations
 */
export type IdOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V extends object = object,
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
 * @typedef AfterOperationHandler
 * @memberOf db-decorators.operations
 */
export type UpdateOperationHandler<
  M extends Model,
  R extends IRepository<M, F, C>,
  V extends object = object,
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
