import {IGeneratorAsync, IGenerator} from "../repository";
import DBModel from "../model/DBModel";

export type OperationHandler = (...args: any[]) => any;

export type Generators<T extends DBModel> = {new(): IGenerator<T> | IGeneratorAsync<T>};