import { RepositoryFlags } from "./types";

/**
 * @description Default configuration flags for repository operations.
 * @summary Provides default values for repository operation flags, excluding the timestamp property.
 * These flags control behavior such as context handling, validation, error handling, and more.
 * @const DefaultRepositoryFlags
 * @memberOf module:db-decorators
 */
export const DefaultRepositoryFlags: Omit<
  RepositoryFlags,
  "timestamp" | "logger"
> = {
  parentContext: undefined,
  childContexts: [],
  ignoredValidationProperties: [],
  callArgs: [],
  writeOperation: false,
  affectedTables: [],
  operation: undefined,
  breakOnHandlerError: true,
  rebuildWithTransient: true,
};
