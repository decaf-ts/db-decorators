/**
 * @summary Holds the DBModel reflection keys
 * @const DBKeys
 *
 * @memberOf module:db-decorators.Model
 */
export const DBKeys = {
  REFLECT: "model.db.",
  REPOSITORY: "repository",
  CLASS: "_class",
  ID: "id",
  INDEX: "index",
  UNIQUE: "unique",
  SERIALIZE: "serialize",
  READONLY: "readonly",
  TIMESTAMP: "timestamp",
  HASH: "hash",
  COMPOSED: "composed",
  ORIGINAL: "__originalObj",
};

/**
 * @summary The default separator when concatenating indexes
 *
 * @const DefaultIndexSeparator
 *
 * @category Managers
 * @subcategory Constants
 */
export const DefaultSeparator = "_";

/**
 * @summary Holds the default timestamp date format
 * @constant DEFAULT_TIMESTAMP_FORMAT
 *
 * @memberOf module:db-decorators.Model
 */
export const DEFAULT_TIMESTAMP_FORMAT = "dd/MM/yyyy HH:mm:ss:S";
