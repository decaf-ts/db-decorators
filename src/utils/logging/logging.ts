import {LOGGER_LEVELS, LOGGING_MSG} from "./constants";
import {stringFormat, formatDate} from "../utils";
import {DEFAULT_TIMESTAMP_FORMAT} from "../../model";
import {LoggedError} from "../errors";

export type LoggerMessage = Error | string;

export interface Logger {
    report(message: LoggerMessage, level: number, ...args: any[]): void;
    all(message: LoggerMessage, ...args: any[]): void;
    info(message: LoggerMessage, ...args: any[]): void;
    debug(message: LoggerMessage, ...args: any[]): void;
    warn(message: LoggerMessage, ...args: any[]): void;
    error(message: LoggerMessage, ...args: any[]): void;
    critical(message: LoggerMessage, ...args: any[]): void;
    setLevel(level: number, ...args: any[]): void;
}

export class LoggerImp implements Logger {
    private level: number;

    private readonly useTimestamp: boolean;
    private readonly logLevel: boolean;
    private readonly timestampFormat: string;
    private readonly logStackTrace: boolean;

    constructor(defaultLevel: number = LOGGER_LEVELS.INFO, useTimestamp = true, logLevel: boolean = true, logStackTrace: boolean = false, timestampFormat = DEFAULT_TIMESTAMP_FORMAT){
        this.level = defaultLevel;
        this.useTimestamp = useTimestamp;
        this.logLevel = logLevel;
        this.logStackTrace = logStackTrace;
        this.timestampFormat = timestampFormat;
    }

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

        if (message instanceof Error)
            if ((!(message instanceof LoggedError) || !message.logged) && message.stack && (level >= LOGGER_LEVELS.ERROR || level === LOGGER_LEVELS.DEBUG)){
                console.log(message.stack);
                if (this.logStackTrace)
                    reportMethod(this.buildMessage(`\n-- StackStrace:\n${message.stack}`, level));
                // @ts-ignore
                message.logged = true;
            }

    }

    info(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.INFO, ...args);
    }

    all(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.ALL, ...args);
    }

    debug(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.DEBUG, ...args);
    }

    warn(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.WARN, ...args);
    }

    error(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.ERROR, ...args);
    }

    critical(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.CRITICAL, ...args);
    }

    setLevel(level: number): void {
        this.debug(stringFormat(LOGGING_MSG.LEVEL_CHANGED, this.level.toString(), level.toString()));
        this.level = level;
    }
}

let currentLogger: Logger;

export function getLogger(){
    if (!currentLogger)
        currentLogger = new LoggerImp();
    return currentLogger;
}

export function setLogger(logger: Logger){
    currentLogger = logger;
    getLogger().debug(LOGGING_MSG.LOGGER_CHANGED);
}

export const info = (message: string, ...args: any[]) => getLogger().info(message, ...args);
export const all= (message: string, ...args: any[]) => getLogger().all(message, ...args);
export const debug = (message: string, ...args: any[]) => getLogger().debug(message, ...args);
export const warn = (message: string, ...args: any[]) => getLogger().warn(message, ...args);
export const error = (message: string, ...args: any[]) => getLogger().error(message, ...args);
export const critical = (message: string, ...args: any[]) => getLogger().critical(message, ...args);