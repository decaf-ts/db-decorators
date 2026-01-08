import { Context } from "./Context";
import { ExtendedMetadata, Model } from "@decaf-ts/decorator-validation";
import { OperationKeys } from "../operations";
import { Constructor } from "@decaf-ts/decoration";
import { Logger } from "@decaf-ts/logging";
import { IRepository } from "../interfaces/index";

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

export type ContextFlags<LOG extends Logger> = {
  logger: LOG;
  timestamp: Date;
};

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
export interface RepositoryFlags<LOG extends Logger = Logger>
  extends ContextFlags<LOG> {
  parentContext?: Context<any>;
  childContexts?: Context<any>[];
  callArgs?: any[];
  ignoredValidationProperties: string[];
  affectedTables:
    | (string | Constructor<ModelExtension>)[]
    | string
    | Constructor<ModelExtension>;
  writeOperation: boolean;
  operation?: OperationKeys;
  breakOnHandlerError: boolean;
  rebuildWithTransient: boolean;
  ignoreValidation: boolean;
  ignoreHandlers: boolean | string | RegExp;
  ignoreDevSafeGuards: boolean;
  mergeForUpdate: boolean;
  applyUpdateValidation: boolean;
  correlationId?: string;
  allowGenerationOverride: boolean;
}

export type LoggerOfFlags<R extends ContextFlags<any>> =
  R extends ContextFlags<infer L> ? L : never;

export type FlagsOfContext<C extends Context<any>> =
  C extends Context<infer F> ? F : never;

export type LoggerOfContext<C extends Context<any>> = LoggerOfFlags<
  FlagsOfContext<C>
>;

export type ContextOfRepository<R extends IRepository<any, any>> =
  R extends IRepository<any, infer C> ? C : never;

export type LoggerOfRepository<R extends IRepository<any, any>> =
  LoggerOfContext<ContextOfRepository<R>>;

export type FlagsOfRepository<R extends IRepository<any, any>> =
  R extends IRepository<any, infer C> ? FlagsOfContext<C> : never;

export type PrimaryKeyType = string | number | bigint;

export type InferredPrimaryKeyType<M extends Model> = ExtendedMetadata<M>;
