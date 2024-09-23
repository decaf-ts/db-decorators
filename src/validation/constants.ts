import { DBKeys } from "../model/constants";

/**
 * @summary holds the default error messages
 * @const DEFAULT_ERROR_MESSAGES
 *
 * @memberOf module:db-decorators.Model
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
 * @summary Update reflection keys
 * @const UpdateValidationKeys
 * @memberOf module:db-decorators.Operations
 */
export const UpdateValidationKeys = {
  REFLECT: "db.update.validation.",
  TIMESTAMP: DBKeys.TIMESTAMP,
  READONLY: DBKeys.READONLY,
};
