import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "../repository/Context";

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
  R extends IRepository<M>,
  V,
  C extends Context<M> = Context<M>,
> =
  | StandardOperationHandler<M, R, V, C>
  | UpdateOperationHandler<M, R, V, C>
  | IdOperationHandler<M, R, V, C>;

/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type StandardOperationHandler<
  M extends Model,
  R extends IRepository<M>,
  V,
  C extends Context<M> = Context<M>,
> = (
  this: R,
  context: C,
  metadata: V,
  key: any,
  model: M
) => Promise<void> | void;

/**
 * @typedef IdOperationHandler
 * @memberOf db-decorators.operations
 */
export type IdOperationHandler<
  M extends Model,
  R extends IRepository<M>,
  V,
  C extends Context<M> = Context<M>,
> = (
  this: R,
  context: C,
  decorator: V,
  key: any,
  id: string
) => Promise<void> | void;

/**
 * @typedef AfterOperationHandler
 * @memberOf db-decorators.operations
 */
export type UpdateOperationHandler<
  M extends Model,
  R extends IRepository<M>,
  V,
  C extends Context<M> = Context<M>,
> = (
  this: R,
  context: C,
  decorator: V,
  key: any,
  model: M,
  oldModel: M
) => Promise<void> | void;
