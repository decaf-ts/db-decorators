/**
 * @summary database errors
 * @const DBErrors
 *
 * @property {string} EXISTS
 * @property {string} MISSING
 *
 * @memberOf module:db-decorators.Repository
 */
export const DBErrors = {
    EXISTS: "Already Exists",
    MISSING: "Missing or Deleted"
}

/**
 * @summary reflection db keys
 * @const DBKeys
 *
 * @property {string} REFLECT
 * @property {string} ID
 * @property {string} READONLY
 * @property {string} TIMESTAMP
 * @property {string} ORIGINAL
 *
 * @memberOf module:db-decorators.Repository
 */
export const DBKeys = {
    REFLECT: 'model.db.',
    ID: "id",
    READONLY: 'readonly',
    TIMESTAMP: 'timestamp',
    ORIGINAL: '__originalObj'
}

/**
 * @summary default error messages
 * @const DEFAULT_ERROR_MESSAGES
 *
 * @property {{INVALID:string, REQUIRED:string}} ID
 * @property {{INVALID:string}} READONLY
 * @property {{INVALID:string, REQUIRED:string, DATE: string}} TIMESTAMP
 * @property {{ITEM:string}} LIST
 *
 * @memberOf module:db-decorators.Repository
 */
export const DEFAULT_ERROR_MESSAGES = {
    ID: {
        INVALID: 'This Id is invalid',
        REQUIRED: 'The Id is mandatory'
    },
    READONLY: {
        INVALID: "This cannot be updated"
    },
    TIMESTAMP: {
        REQUIRED: 'Timestamp is Mandatory',
        DATE: "The Timestamp must the a valid date",
        INVALID: "This value must always increase"
    },
    LIST: {
        ITEM: 'Invalid list item at position {0}: {1}'
    }
}

/**
 * @summary Update reflection keys
 * @const UpdateValidationKeys
 * @memberOf module:db-decorators.Operations
 */
export const UpdateValidationKeys = {
    REFLECT: 'db.update.validation.',
    TIMESTAMP: DBKeys.TIMESTAMP,
    READONLY: DBKeys.READONLY
}