import {LOGGER_LEVELS, LOGGING_MSG} from "./constants";
import {LoggedError} from "../errors";
import {DEFAULT_TIMESTAMP_FORMAT} from "../model";
import {formatDate, stringFormat} from "@tvenceslau/decorator-validation/lib";

/**
 * @typedef LoggerMessage
 * @memberOf db-decorators.logging
 */
export type LoggerMessage = Error | string;

/**
 * @interface Logger
 * @memberOf db-decorators.logging
 */
export interface Logger {
    /**
     * Reports a message
     * @param {LoggerMessage} message
     * @param {number} level
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    report(message: LoggerMessage, level: number, ...args: any[]): void;

    /**
     * {@link Logger#report}s a message under {@link LOGGER_LEVELS.ALL}
     * @param {LoggerMessage} message
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    all(message: LoggerMessage, ...args: any[]): void;
    /**
     * {@link Logger#report}s a message under {@link LOGGER_LEVELS.INFO}
     * @param {LoggerMessage} message
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    info(message: LoggerMessage, ...args: any[]): void;
    /**
     * {@link Logger#report}s a message under {@link LOGGER_LEVELS.DEBUG}
     * @param {LoggerMessage} message
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    debug(message: LoggerMessage, ...args: any[]): void;
    /**
     * {@link Logger#report}s a message under {@link LOGGER_LEVELS.WARN}
     * @param {LoggerMessage} message
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    warn(message: LoggerMessage, ...args: any[]): void;
    /**
     * {@link Logger#report}s a message under {@link LOGGER_LEVELS.ERROR}
     * @param {LoggerMessage} message
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    error(message: LoggerMessage, ...args: any[]): void;
    /**
     * {@link Logger#report}s a message under {@link LOGGER_LEVELS.CRITICAL}
     * @param {LoggerMessage} message
     * @param {any[]} [args]
     *
     * @memberOf Logger
     */
    critical(message: LoggerMessage, ...args: any[]): void;

    /**
     * Defines the Logger level
     *
     * @param {number} level
     * @param {any[]} args
     *
     * @memberOf Logger
     */
    setLevel(level: number, ...args: any[]): void;
}

/**
 * Default Logger Implementation
 *
 * @class LoggerImp
 * @implements Logger
 *
 * @memberOf db-decorators.logging
 */
export class LoggerImp implements Logger {
    private level: number;

    private readonly useTimestamp: boolean;
    private readonly logLevel: boolean;
    private readonly timestampFormat: string;
    private readonly logStackTrace: boolean;

    /**
     * @constructor
     * @param {number} defaultLevel defaults to {@link LOGGER_LEVELS.INFO}
     * @param {boolean} useTimestamp defaults to true
     * @param {boolean} logLevel
     * @param {boolean} logStackTrace
     * @param {string} timestampFormat
     */
    constructor(defaultLevel: number = LOGGER_LEVELS.INFO, useTimestamp = true, logLevel: boolean = true, logStackTrace: boolean = false, timestampFormat = DEFAULT_TIMESTAMP_FORMAT){
        this.level = defaultLevel;
        this.useTimestamp = useTimestamp;
        this.logLevel = logLevel;
        this.logStackTrace = logStackTrace;
        this.timestampFormat = timestampFormat;
    }

    /**
     * Builts the actual logging message
     * @param {LoggerMessage} message
     * @param {number} logLevel if the level is to be logged
     * @param {any} issuer who is logging the message
     * @param {any[]} args
     * @protected
     */
    protected buildMessage(message: LoggerMessage, logLevel: number, issuer: any = undefined, ...args: any[]){
        let stacksTrace: string | undefined = undefined;
        if (message instanceof Error){
            stacksTrace = message.stack;
            message = message.message;
        }

        if (this.logLevel)
            message = `[${Object.keys(LOGGER_LEVELS)[logLevel]}] - ${message}`;
        if (issuer)
            message = `[${issuer.toString()}]${message}`;
        if (this.useTimestamp)
            message = `[${formatDate(new Date(), this.timestampFormat)}]${message}`;
        return stringFormat(message, ...args);
    }

    /**
     *
     * @param {LoggerMessage} message
     * @param {number} level defaults to {@link LOGGER_LEVELS.INFO}
     * @param {any[]} args
     */
    report(message: LoggerMessage, level: number = LOGGER_LEVELS.INFO, ...args: any[]) : void {
        if (level < this.level)
            return;
        if (message instanceof LoggedError && message.logged)
            return;

        let reportMethod: Function;
        switch (level){
            case LOGGER_LEVELS.WARN:
                reportMethod = console.warn;
                break;
            case LOGGER_LEVELS.ERROR:
            case LOGGER_LEVELS.CRITICAL:
                reportMethod = console.error;
                break;
            case LOGGER_LEVELS.INFO:
            case LOGGER_LEVELS.DEBUG:
            case LOGGER_LEVELS.ALL:
            default:
                reportMethod = console.log;
                break;
        }

        let finalMessage = this.buildMessage(message, level, undefined, ...args);
        reportMethod(finalMessage);

        if (message instanceof Error && message.stack && this.logStackTrace){
            console.log(message);
            reportMethod(this.buildMessage(`\n-- StackStrace:\n${message.stack}`, level));
        }

        if (message instanceof LoggedError)
            message.logged = true;
    }

    /**
     * @inheritDoc
     */
    info(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.INFO, ...args);
    }
    /**
     * @inheritDoc
     */
    all(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.ALL, ...args);
    }
    /**
     * @inheritDoc
     */
    debug(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.DEBUG, ...args);
    }
    /**
     * @inheritDoc
     */
    warn(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.WARN, ...args);
    }
    /**
     * @inheritDoc
     */
    error(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.ERROR, ...args);
    }
    /**
     * @inheritDoc
     */
    critical(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.CRITICAL, ...args);
    }
    /**
     * @inheritDoc
     */
    setLevel(level: number): void {
        this.debug(stringFormat(LOGGING_MSG.LEVEL_CHANGED, this.level.toString(), level.toString()));
        this.level = level;
    }
}

let currentLogger: Logger;

/**
 * gets the current Logger
 *
 * @function getLogger
 *
 * @memberOf db-decorators.logging
 */
export function getLogger(){
    if (!currentLogger)
        currentLogger = new LoggerImp();
    return currentLogger;
}

/**
 * Sets the logger
 *
 * @param {Logger} logger
 *
 * @function setLogger
 *
 * @memberOf db-decorators.logging
 */
export function setLogger(logger: Logger){
    currentLogger = logger;
    getLogger().debug(LOGGING_MSG.LOGGER_CHANGED);
}

/**
 * Reports a message to the logger under the level {@link LOGGER_LEVELS.INFO}
 * @param {string} message
 * @param {any[]} args
 *
 * @function info
 *
 * @memberOf db-decorators.logging
 */
export const info = (message: string, ...args: any[]) => getLogger().info(message, ...args);
/**
 * Reports a message to the logger under the level {@link LOGGER_LEVELS.ALL}
 * @param {string} message
 * @param {any[]} args
 *
 * @function all
 *
 * @memberOf db-decorators.logging
 */
export const all = (message: string, ...args: any[]) => getLogger().all(message, ...args);
/**
 * Reports a message to the logger under the level {@link LOGGER_LEVELS.DEBUG}
 * @param {string} message
 * @param {any[]} args
 *
 * @function debug
 *
 * @memberOf db-decorators.logging
 */
export const debug = (message: string, ...args: any[]) => getLogger().debug(message, ...args);
/**
 * Reports a message to the logger under the level {@link LOGGER_LEVELS.WARN}
 * @param {string} message
 * @param {any[]} args
 *
 * @function warn
 *
 * @memberOf db-decorators.logging
 */
export const warn = (message: string, ...args: any[]) => getLogger().warn(message, ...args);
/**
 * Reports a message to the logger under the level {@link LOGGER_LEVELS.ERROR}
 * @param {string} message
 * @param {any[]} args
 *
 * @function error
 *
 * @memberOf db-decorators.logging
 */
export const error = (message: string, ...args: any[]) => getLogger().error(message, ...args);
/**
 * Reports a message to the logger under the level {@link LOGGER_LEVELS.CRITICAL}
 * @param {string} message
 * @param {any[]} args
 *
 * @function critical
 *
 * @memberOf db-decorators.logging
 */
export const critical = (message: string, ...args: any[]) => getLogger().critical(message, ...args);