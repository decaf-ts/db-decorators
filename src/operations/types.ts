import { DBModel } from "../model/DBModel";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";

export type OperationMetadata = {
  operation: OperationKeys;
  handler: string;
  args: any[];
  props: string[];
};

/**
 * @typedef OperationHandler
 * @memberOf db-decorators.operations
 */
export type OperationHandler<T extends DBModel, Y extends IRepository<T>> =
  | StandardOperationHandler<T, Y>
  | UpdateOperationHandler<T, Y>;

/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type StandardOperationHandler<
  T extends DBModel,
  Y extends IRepository<T>,
> = (this: Y, key: any, model: T, ...args: any[]) => Promise<T>;

/**
 * @typedef AfterOperationHandler
 * @memberOf db-decorators.operations
 */
export type UpdateOperationHandler<
  T extends DBModel,
  Y extends IRepository<T>,
> = (this: Y, key: any, model: T, oldModel: T, ...args: any[]) => Promise<T>;
