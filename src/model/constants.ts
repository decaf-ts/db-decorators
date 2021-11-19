/**
 * @enum DBKeys
 * @memberOf model
 */
export const DBKeys = {
    REFLECT: 'model.db.',
    ID: "id",
    TIMESTAMP: 'timestamp'
}

/**
 * @enum DEFAULT_ERROR_MESSAGES
 * @memberOf model
 */
export const DEFAULT_ERROR_MESSAGES = {
    ID: 'This id is invalid',
    TIMESTAMP: {
        REQUIRED: 'Timestamp is Mandatory',
        DATE: "The Timestamp must the a valid date"
    }
}

export const DEFAULT_TIMESTAMP_FORMAT = "dd/MM/yyyy hh:mm:ss:S";