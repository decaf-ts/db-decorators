import {LOGGER_LEVELS} from "../logging/constants";
import {Callback} from "../../repository";
import {getLogger, LoggerMessage} from "../logging/logging";

export function loggedCallback(message: LoggerMessage, level: number, callback: Callback){
    if (!callback){
        // @ts-ignore
        callback = level;
        level = LOGGER_LEVELS.INFO;
    }
    getLogger().report(message, level);
    callback(message);
}

export function debugCallback(message: LoggerMessage, callback: Callback){
    loggedCallback(message, LOGGER_LEVELS.DEBUG, callback);
}

export function infoCallback(message: LoggerMessage, callback: Callback){
    loggedCallback(message, LOGGER_LEVELS.INFO, callback);
}

export function warningCallback(message: LoggerMessage, callback: Callback){
    loggedCallback(message, LOGGER_LEVELS.WARN, callback);
}
export function errorCallback(message: LoggerMessage, callback: Callback){
    loggedCallback(message, LOGGER_LEVELS.ERROR, callback);
}

export function criticalCallback(message: LoggerMessage, callback: Callback){
    loggedCallback(message, LOGGER_LEVELS.CRITICAL, callback);
}

export class LoggedError extends Error {
    constructor(error: LoggerMessage, level: number = LOGGER_LEVELS.ERROR) {
        super(error instanceof Error ? error.message : error);
        getLogger().report(error, level);
    }
}

export class CriticalError extends LoggedError{
    constructor(error: LoggerMessage) {
        super(error, LOGGER_LEVELS.CRITICAL);
    }
}