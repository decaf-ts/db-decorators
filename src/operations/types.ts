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
export type OperationHandler<M extends Model, R extends IRepository<M>, V> =
  | StandardOperationHandler<M, R, V>
  | UpdateOperationHandler<M, R, V>
  | IdOperationHandler<M, R, V>;

/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type StandardOperationHandler<
  M extends Model,
  R extends IRepository<M>,
  V,
> = (
  this: R,
  context: Context<M>,
  metadata: V,
  key: any,
  model: M
) => Promise<void> | void;

/**
 * @typedef IdOperationHandler
 * @memberOf db-decorators.operations
 */
export type IdOperationHandler<M extends Model, R extends IRepository<M>, V> = (
  this: R,
  context: Context<M>,
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
> = (
  this: R,
  context: Context<M>,
  decorator: V,
  key: any,
  model: M,
  oldModel: M
) => Promise<void> | void;
