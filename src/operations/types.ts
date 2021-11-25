import {IGeneratorAsync, IGenerator, Repository, AsyncRepository, ModelCallback} from "../repository";
import DBModel from "../model/DBModel";

export type OperationHandler<T extends DBModel> = OnOperationHandlerSync<T> | AfterOperationHandlerAsync<T>;

export type OperationHandlerSync<T extends DBModel> = OnOperationHandlerSync<T> | AfterOperationHandlerSync<T>;

export type OperationHandlerAsync<T extends DBModel> = OnOperationHandlerAsync<T> | AfterOperationHandlerAsync<T>;

export type OnOperationHandler<T extends DBModel> = OnOperationHandlerSync<T> | OnOperationHandlerAsync<T>;

export type AfterOperationHandler<T extends DBModel> = AfterOperationHandlerSync<T> | AfterOperationHandlerAsync<T>;

export type OnOperationHandlerSync<T extends DBModel> = (this: Repository<T>, key?: any, model?: T, ...args: any[]) => any

export type AfterOperationHandlerSync<T extends DBModel> = (this: Repository<T>, key?: any, model?: T, ...args: any[]) => any

export type OnOperationHandlerAsync<T extends DBModel> = (this: AsyncRepository<T>, key?: any, model?: T | ModelCallback<T>, ...args: any[]) => any;

export type AfterOperationHandlerAsync<T extends DBModel> = (this: AsyncRepository<T>, key?: any, model?: T | ModelCallback<T>, ...args: any[]) => any;

export type Generators<T extends DBModel> = {new(): IGenerator<T> | IGeneratorAsync<T>};