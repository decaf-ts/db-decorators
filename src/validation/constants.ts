import { DBKeys } from "../model/constants";

/**
 * @description Collection of default error messages used by validators.
 * @summary Holds the default error messages for various validation scenarios including ID validation, readonly properties, and timestamps.
 * @typedef {Object} ErrorMessages
 * @property {Object} ID - Error messages for ID validation
 * @property {string} ID.INVALID - Error message when an ID is invalid
 * @property {string} ID.REQUIRED - Error message when an ID is missing
 * @property {Object} READONLY - Error messages for readonly properties
 * @property {string} READONLY.INVALID - Error message when attempting to update a readonly property
 * @property {Object} TIMESTAMP - Error messages for timestamp validation
 * @property {string} TIMESTAMP.REQUIRED - Error message when a timestamp is missing
 * @property {string} TIMESTAMP.DATE - Error message when a timestamp is not a valid date
 * @property {string} TIMESTAMP.INVALID - Error message when a timestamp is not increasing
 * @const DEFAULT_ERROR_MESSAGES
 * @memberOf module:validation
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
 * @description Constants used for reflection-based validation during update operations.
 * @summary Keys used for storing and retrieving validation metadata on model properties during update operations.
 * @typedef {Object} ValidationKeys
 * @property {string} REFLECT - Base reflection key prefix for update validation
 * @property {string} TIMESTAMP - Key for timestamp validation
 * @property {string} READONLY - Key for readonly property validation
 * @const UpdateValidationKeys
 * @memberOf module:validation
 */
export const UpdateValidationKeys = {
  REFLECT: "db.update.validation.",
  TIMESTAMP: DBKeys.TIMESTAMP,
  READONLY: DBKeys.READONLY,
};
