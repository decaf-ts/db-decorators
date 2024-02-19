import {DBModel} from "../../../model";
import {AsyncRepository, ModelCallback, Repository} from "../types";

/**
 * @typedef OperationHandler
 * @memberOf module:db-decorators.Operations
 */
export type OperationHandler<T extends DBModel> = OnOperationHandlerSync<T> | AfterOperationHandlerAsync<T>;
/**
 * @typedef OperationHandlerSync
 * @memberOf module:db-decorators.Operations
 */
export type OperationHandlerSync<T extends DBModel> = OnOperationHandlerSync<T> | AfterOperationHandlerSync<T>;
/**
 * @typedef OperationHandlerAsync
 * @memberOf module:db-decorators.Operations
 */
export type OperationHandlerAsync<T extends DBModel> = OnOperationHandlerAsync<T> | AfterOperationHandlerAsync<T>;
/**
 * @typedef OnOperationHandler
 * @memberOf module:db-decorators.Operations
 */
export type OnOperationHandler<T extends DBModel> = OnOperationHandlerSync<T> | OnOperationHandlerAsync<T>;
/**
 * @typedef AfterOperationHandler
 * @memberOf module:db-decorators.Operations
 */
export type AfterOperationHandler<T extends DBModel> = AfterOperationHandlerSync<T> | AfterOperationHandlerAsync<T>;
/**
 * @typedef OnOperationHandlerSync
 * @memberOf module:db-decorators.Operations
 */
export type OnOperationHandlerSync<T extends DBModel> = (this: Repository<T>, key: string, model: T, ...args: (any | ModelCallback<T>)[]) => any
/**
 * @typedef AfterOperationHandlerSync
 * @memberOf module:db-decorators.Operations
 */
export type AfterOperationHandlerSync<T extends DBModel> = (this: Repository<T>, key: string, model: T, ...args: (any | ModelCallback<T>)[]) => any
/**
 * @typedef OnOperationHandlerAsync
 * @memberOf module:db-decorators.Operations
 */
export type OnOperationHandlerAsync<T extends DBModel> = (this: AsyncRepository<T>, key: string, model: T, ...args: (any | ModelCallback<T>)[]) => any;
/**
 * @typedef AfterOperationHandlerAsync
 * @memberOf module:db-decorators.Operations
 */
export type AfterOperationHandlerAsync<T extends DBModel> = (this: AsyncRepository<T>, key: string, model: T, ...args: (any | ModelCallback<T>)[]) => any;