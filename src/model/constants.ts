import { ModelKeys } from "@decaf-ts/decorator-validation";

/**
 * @description Database reflection keys
 * @summary Collection of keys used for reflection metadata in database operations
 * @const DBKeys
 * @memberOf module:db-decorators
 */
export const DBKeys = {
  REFLECT: `${ModelKeys.MODEL}.persistence.`,
  REPOSITORY: "repository",
  CLASS: "_class",
  ID: "id",
  INDEX: "index",
  UNIQUE: "unique",
  SERIALIZE: "serialize",
  READONLY: "readonly",
  TIMESTAMP: "timestamp",
  TRANSIENT: "transient",
  HASH: "hash",
  COMPOSED: "composed",
  VERSION: "version",
  ORIGINAL: "__originalObj",
};

/**
 * @description Default separator character for composite indexes
 * @summary The default separator character used when concatenating multiple fields into a single index
 * @const DefaultSeparator
 * @memberOf module:db-decorators
 */
export const DefaultSeparator = "_";

/**
 * @description Default format for timestamp fields
 * @summary Standard date format string used for timestamp fields in database models
 * @const DEFAULT_TIMESTAMP_FORMAT
 * @memberOf module:db-decorators
 */
export const DEFAULT_TIMESTAMP_FORMAT = "dd/MM/yyyy HH:mm:ss:S";
