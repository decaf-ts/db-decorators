import {LOGGER_LEVELS} from "../logging/constants";
import {Callback} from "../../repository";
import {getLogger, LoggerMessage} from "../logging/logging";

export function loggedCallback(this: any, message: LoggerMessage, level: number | Callback, callback: Callback){
    if (!callback){
        // @ts-ignore
        callback = level;
        level = LOGGER_LEVELS.INFO;
    }

    getLogger().report(message instanceof Error ? message : new Error(message), level as number, this.name !== "loggedCallback" ? this : undefined);
    callback(message);
}

export function allCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.ALL, callback);
}

export function debugCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.DEBUG, callback);
}

export function infoCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.INFO, callback);
}

export function warningCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.WARN, callback);
}
export function errorCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.ERROR, callback);
}

export function criticalCallback(this: any, message: LoggerMessage, callback: Callback){
    loggedCallback.call(this, message, LOGGER_LEVELS.CRITICAL, callback);
}

export class LoggedError extends Error {
    readonly logged = false;

    constructor(error: LoggerMessage, level: number = LOGGER_LEVELS.ERROR) {
        super(error instanceof Error ? error.message : error);
        this.logged = error instanceof LoggedError && error.logged;
        if (!this.logged)
            getLogger().report(error, level);
    }
}

export class CriticalError extends LoggedError{
    constructor(error: LoggerMessage) {
        super(error, LOGGER_LEVELS.CRITICAL);
    }
}