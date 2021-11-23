import {LOGGER_LEVELS} from "../logging/constants";
import {Callback} from "../../repository";
import {getLogger, LoggerMessage} from "../logging/logging";

export function loggedCallback(message: LoggerMessage, level: number, callback: Callback){
    if (!callback){
        // @ts-ignore
        callback = level;
        level = LOGGER_LEVELS.LOG
    }
    getLogger().report(message, level);
    callback(message);
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