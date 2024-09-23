import { DBModel } from "../model/DBModel";
import { Repository } from "../repository/Repository";
import { OperationKeys } from "./constants";

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
export type OperationHandler<T extends DBModel> =
  | OnOperationHandler<T>
  | AfterOperationHandler<T>;

/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type OnOperationHandler<T extends DBModel> = (
  this: Repository<T>,
  key?: any,
  model?: T,
  ...args: any[]
) => Promise<T> | T;
/**
 * @typedef AfterOperationHandler
 * @memberOf db-decorators.operations
 */
export type AfterOperationHandler<T extends DBModel> = (
  this: Repository<T>,
  key?: any,
  model?: T,
  ...args: any[]
) => Promise<T> | T;
