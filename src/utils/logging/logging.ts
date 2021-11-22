import {LOGGER_LEVELS, LOGGING_MSG} from "./constants";
import {stringFormat, formatDate} from "../utils";
import {DEFAULT_TIMESTAMP_FORMAT} from "../../model";

export type LoggerMessage = Error | string;

export interface Logger {
    report(message: LoggerMessage, level: number, ...args: any[]): void;
    log(message: LoggerMessage, ...args: any[]): void;
    info(message: LoggerMessage, ...args: any[]): void;
    warn(message: LoggerMessage, ...args: any[]): void;
    error(message: LoggerMessage, ...args: any[]): void;
    critical(message: LoggerMessage, ...args: any[]): void;
    setLevel(level: number): void;
}

export class LoggerImp implements Logger {
    private level: number;

    private readonly useTimestamp: boolean;
    private readonly logLevel: boolean;
    private readonly timestampFormat: string;
    private readonly logStackTrace: boolean;

    constructor(defaultLevel: number = LOGGER_LEVELS.LOG, useTimestamp = true, logLevel: boolean = true, logStackTrace: boolean = false, timestampFormat = DEFAULT_TIMESTAMP_FORMAT){
        this.level = defaultLevel;
        this.useTimestamp = useTimestamp;
        this.logLevel = logLevel;
        this.logStackTrace = logStackTrace;
        this.timestampFormat = timestampFormat;
    }

    protected buildMessage(message: LoggerMessage, logLevel: number, ...args: any[]){
        let stacksTrace: string | undefined = undefined;
        if (message instanceof Error){
            stacksTrace = message.stack;
            message = message.message;
        }

        if (this.logLevel)
            message = `[${Object.keys(LOGGER_LEVELS)[logLevel]}] - ${message}`;
        if (this.useTimestamp)
            message = `[${formatDate(new Date(), this.timestampFormat)}]${message}`;
        return stringFormat(message, ...args) + (this.logStackTrace && stacksTrace ? `\n-- StackStrace:\n${stacksTrace}`: '');
    }

    report(message: LoggerMessage, level: number = LOGGER_LEVELS.LOG, ...args: any[]) : void {
        if (level < this.level)
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
            case LOGGER_LEVELS.LOG:
            default:
                reportMethod = console.log;
                break;
        }

        let finalMessage = this.buildMessage(message, level, ...args);
        reportMethod(finalMessage);
        if (message instanceof Error)
            console.log(message.stack);
    }

    info(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.INFO, ...args);
    }

    log(message: LoggerMessage, ...args: any[]): void {
        this.report(message, LOGGER_LEVELS.LOG, ...args);
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
        this.log(stringFormat(LOGGING_MSG.LEVEL_CHANGED, this.level.toString(), level.toString()))
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
    getLogger().log(LOGGING_MSG.LOGGER_CHANGED);
}

export const info = (message: string, ...args: any[]) => getLogger().info(message, ...args);
export const log = (message: string, ...args: any[]) => getLogger().log(message, ...args);
export const warn = (message: string, ...args: any[]) => getLogger().warn(message, ...args);
export const error = (message: string, ...args: any[]) => getLogger().error(message, ...args);
export const critical = (message: string, ...args: any[]) => getLogger().critical(message, ...args);