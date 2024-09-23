/**
 * @summary Holds the DBModel reflection keys
 * @const DBKeys
 *
 * @memberOf module:db-decorators.Model
 */
export const DBKeys = {
  REFLECT: "model.db.",
  ID: "id",
  INDEX: "index",
  UNIQUE: "unique",
  SERIALIZE: "serialize",
  READONLY: "readonly",
  TIMESTAMP: "timestamp",
  ORIGINAL: "__originalObj",
};

/**
 * @summary Holds the default timestamp date format
 * @constant DEFAULT_TIMESTAMP_FORMAT
 *
 * @memberOf module:db-decorators.Model
 */
export const DEFAULT_TIMESTAMP_FORMAT = "dd/MM/yyyy HH:mm:ss:S";
