import { DBModel } from "../model/DBModel";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";

export type OperationMetadata<T> = {
  operation: OperationKeys;
  handler: string;
  metadata?: T;
};

/**
 * @typedef OperationHandler
 * @memberOf db-decorators.operations
 */
export type OperationHandler<T extends DBModel, Y extends IRepository<T>, V> =
  | StandardOperationHandler<T, Y, V>
  | UpdateOperationHandler<T, Y, V>
  | IdOperationHandler<T, Y, V>;

/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type StandardOperationHandler<
  T extends DBModel,
  Y extends IRepository<T>,
  V,
> = (this: Y, metadata: V, key: any, model: T) => Promise<void> | void;

/**
 * @typedef IdOperationHandler
 * @memberOf db-decorators.operations
 */
export type IdOperationHandler<
  T extends DBModel,
  Y extends IRepository<T>,
  V,
> = (this: Y, decorator: V, key: any, id: string) => Promise<void> | void;

/**
 * @typedef AfterOperationHandler
 * @memberOf db-decorators.operations
 */
export type UpdateOperationHandler<
  T extends DBModel,
  Y extends IRepository<T>,
  V,
> = (
  this: Y,
  decorator: V,
  key: any,
  model: T,
  oldModel: T,
) => Promise<void> | void;
