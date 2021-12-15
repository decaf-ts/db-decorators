import {Callback} from "../repository";
import {getLogger, LOGGER_LEVELS, LoggerMessage} from "../logging";

/**
 *
 * @param {string} message
 * @param {number} level
 * @param {Callback} callback
 *
 * @function loggedCallback
 *
 * @memberOf db-decorators.errors
 */
export function loggedCallback(this: any, message: LoggerMessage, level: number | Callback, callback: Callback){
    if (!callback){
        // @ts-ignore
        callback = level;
        level = LOGGER_LEVELS.INFO;
    }

    getLogger().report(message instanceof Error ? message : new LoggedError(message), level as number, this.name !== "loggedCallback" ? this : undefined);
    callback(message);
}

/**
 *
 * @param {LoggerMessage} message
 * @param {Callback} callback
 *
 * @function allCallback
 *
 * @memberOf db-decorators.errors
 */
export function allCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.ALL, callback);
}

/**
 *
 * @param {LoggerMessage} message
 * @param {Callback} callback
 *
 * @function debugCallback
 *
 * @memberOf db-decorators.errors
 */
export function debugCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.DEBUG, callback);
}

/**
 *
 * @param {LoggerMessage} message
 * @param {Callback} callback
 *
 * @function infoCallback
 *
 * @memberOf db-decorators.errors
 */
export function infoCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.INFO, callback);
}

/**
 *
 * @param {LoggerMessage} message
 * @param {Callback} callback
 *
 * @function warningCallback
 *
 * @memberOf db-decorators.errors
 */
export function warningCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.WARN, callback);
}

/**
 *
 * @param {LoggerMessage} message
 * @param {Callback} callback
 *
 * @function errorCallback
 *
 * @memberOf db-decorators.errors
 */
export function errorCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.ERROR, callback);
}

/**
 *
 * @param {LoggerMessage} message
 * @param {Callback} callback
 *
 * @function criticalCallback
 *
 * @memberOf db-decorators.errors
 */
export function criticalCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.CRITICAL, callback);
}

/**
 * Wrapper Class for Logged Errors
 *
 * @class LoggedError
 * @extends Error
 *
 * @memberOf db-decorators.errors
 */
export class LoggedError extends Error {
    /**
     * @property logged
     */
    logged = false;

    /**
     * @constructor
     * @param {LoggerMessage} error
     * @param {number} level defaults to {@link LOGGER_LEVELS.ERROR}
     */
    constructor(error: LoggerMessage, level: number = LOGGER_LEVELS.ERROR) {
        super(error instanceof Error ? error.message : error);
        this.logged = error instanceof LoggedError && error.logged;
        if (!this.logged)
            getLogger().report(error, level);
    }
}

/**
 * Wrapper Class for Critical Errors
 *
 * @class CriticalError
 * @extends LoggedError
 *
 * @memberOf db-decorators.errors
 */
export class CriticalError extends LoggedError{
    constructor(error: LoggerMessage) {
        super(error, LOGGER_LEVELS.CRITICAL);
    }
}