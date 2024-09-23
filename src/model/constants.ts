/**
 * @summary Holds the DBModel reflection keys
 * @const DBKeys
 *
 * @memberOf module:db-decorators.Model
 */
export const DBKeys = {
  REFLECT: "model.db.",
  ID: "id",
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
