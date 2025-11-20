import { Context } from "./Context";
import { Model } from "@decaf-ts/decorator-validation";
import { OperationKeys } from "../operations";
import { Constructor } from "@decaf-ts/decoration";

/**
 * @description Type utility for ensuring model extension.
 * @summary A conditional type that ensures a type extends the Model class.
 * If the type extends Model, it returns the type; otherwise, it returns never.
 * @template M - The type to check, defaults to Model
 * @typedef {M extends Model ? M : never} ModelExtension
 * @memberOf module:db-decorators
 */
export type ModelExtension<M extends Model = Model> = M extends Model
  ? M
  : never;

/**
 * @description Configuration flags for repository operations.
 * @summary Defines the configuration options that control repository behavior during operations.
 * These flags manage context relationships, validation behavior, operation metadata, and error handling.
 * @interface RepositoryFlags
 * @property {Context} [parentContext] - The parent context for hierarchical operations
 * @property {Context[]} [childContexts] - Child contexts spawned from this context
 * @property {any[]} [callArgs] - Arguments passed to the operation
 * @property {string[]} ignoredValidationProperties - Properties to exclude from validation
 * @property affectedTables - Tables or models affected by the operation
 * @property {boolean} writeOperation - Whether the operation modifies data
 * @property {Date} timestamp - When the operation was initiated
 * @property {OperationKeys} [operation] - The type of operation being performed
 * @property {boolean} breakOnHandlerError - Whether to stop processing on handler errors
 * @property {boolean} rebuildWithTransient - Whether to include transient properties when rebuilding models
 * @memberOf module:db-decorators
 */
export interface RepositoryFlags {
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
  rebuildWithTransient: boolean;
}
