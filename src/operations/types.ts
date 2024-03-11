import { DBModel } from "../model/DBModel";

/**
 * @typedef OperationHandler
 * @memberOf db-decorators.operations
 */
export type OperationHandler<T extends DBModel> =
  | OnOperationHandlerSync<T>
  | AfterOperationHandlerAsync<T>;
/**
 * @typedef OperationHandlerSync
 * @memberOf db-decorators.operations
 */

export type OperationHandlerSync<T extends DBModel> =
  | OnOperationHandlerSync<T>
  | AfterOperationHandlerSync<T>;
/**
 * @typedef OperationHandlerAsync
 * @memberOf db-decorators.operations
 */
export type OperationHandlerAsync<T extends DBModel> =
  | OnOperationHandlerAsync<T>
  | AfterOperationHandlerAsync<T>;
/**
 * @typedef OnOperationHandler
 * @memberOf db-decorators.operations
 */
export type OnOperationHandler<T extends DBModel> =
  | OnOperationHandlerSync<T>
  | OnOperationHandlerAsync<T>;
/**
 * @typedef AfterOperationHandler
 * @memberOf db-decorators.operations
 */
export type AfterOperationHandler<T extends DBModel> =
  | AfterOperationHandlerSync<T>
  | AfterOperationHandlerAsync<T>;
/**
 * @typedef OnOperationHandlerSync
 * @memberOf db-decorators.operations
 */
export type OnOperationHandlerSync<T extends DBModel> = (
  this: Repository<T>,
  key?: any,
  model?: T,
  ...args: any[]
) => any;
/**
 * @typedef AfterOperationHandlerSync
 * @memberOf db-decorators.operations
 */
export type AfterOperationHandlerSync<T extends DBModel> = (
  this: Repository<T>,
  key?: any,
  model?: T,
  ...args: any[]
) => any;
/**
 * @typedef OnOperationHandlerAsync
 * @memberOf db-decorators.operations
 */
export type OnOperationHandlerAsync<T extends DBModel> = (
  this: AsyncRepository<T>,
  key?: any,
  model?: T | ModelCallback<T>,
  ...args: any[]
) => any;
/**
 * @typedef AfterOperationHandlerAsync
 * @memberOf db-decorators.operations
 */
export type AfterOperationHandlerAsync<T extends DBModel> = (
  this: AsyncRepository<T>,
  key?: any,
  model?: T | ModelCallback<T>,
  ...args: any[]
) => any;
/**
 * @typedef Generators
 * @memberOf db-decorators.operations
 */
export type Generators<T extends DBModel> = {
  new (): IGenerator<T> | IGeneratorAsync<T>;
};
