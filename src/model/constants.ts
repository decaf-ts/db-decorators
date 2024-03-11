/**
 * @enum DBKeys
 * @category Constants
 */
export const DBKeys = {
  REFLECT: "model.db.",
  ID: "id",
  READONLY: "readonly",
  TIMESTAMP: "timestamp",
  ORIGINAL: "__originalObj",
};

/**
 * @enum DEFAULT_ERROR_MESSAGES
 * @category Constants
 */
export const DEFAULT_ERROR_MESSAGES = {
  ID: {
    INVALID: "This Id is invalid",
    REQUIRED: "The Id is mandatory",
  },
  READONLY: {
    INVALID: "This cannot be updated",
  },
  TIMESTAMP: {
    REQUIRED: "Timestamp is Mandatory",
    DATE: "The Timestamp must the a valid date",
    INVALID: "This value must always increase",
  },
};

/**
 * @constant DEFAULT_TIMESTAMP_FORMAT
 * @category Constants
 */
export const DEFAULT_TIMESTAMP_FORMAT = "dd/MM/yyyy HH:mm:ss:S";
