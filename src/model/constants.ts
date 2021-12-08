/**
 * @enum DBKeys
 * @memberOf model
 */
export const DBKeys = {
    REFLECT: 'model.db.',
    ID: "id",
    READONLY: 'readonly',
    TIMESTAMP: 'timestamp'
}

/**
 * @enum DEFAULT_ERROR_MESSAGES
 * @memberOf model
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
    }
}

export const DEFAULT_TIMESTAMP_FORMAT = "dd/MM/yyyy HH:mm:ss:S";