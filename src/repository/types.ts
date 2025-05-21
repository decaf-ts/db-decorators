import { Context } from "./Context";
import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { OperationKeys } from "../operations";

type ModelExtension<M extends Model = Model> = M extends Model ? M : never;

export type RepositoryFlags = {
  parentContext?: Context<any>;
  childContexts?: Context<any>[];
  callArgs?: any[];
  ignoredValidationProperties: string[];
  affectedTables:
    | (string | Constructor<ModelExtension>)[]
    | string
    | Constructor<ModelExtension>;
  writeOperation: boolean;
  timestamp: Date;
  operation?: OperationKeys;
  breakOnHandlerError: boolean;
};
