import {Callback, Err} from "../repository";
import {CriticalError} from "../errors";
import {getLogger} from "./logging";
import {LOGGER_LEVELS} from "./constants";

/**
 * Util class to measure time between two points in time;
 * @namespace logging
 * @class
 */
export class StopWatch{
    private startTime?: number;

    /**
     * Resets the start time
     */
    start(){
        this.startTime = Date.now();
    }

    /**
     * returns the difference between now and the start time
     */
    check(): number {
        if (!this.startTime)
            throw new Error('StopWatch didnt start');
        return Date.now() - this.startTime;
    }

    /**
     * returns the difference between now and the start time
     * stops the TimeWatch
     */
    stop(): number {
        const result = this.check();
        this.startTime = undefined;
        return result;
    }
}

/**
 * Async Method decorator to log the input and output of that method
 *
 * @param {number} [level] Logging Level as in {@link LOGGER_LEVELS} defaults to {@link LOGGER_LEVELS.DEBUG}
 * @param {boolean} [benchmark] determines if the logging includes the duration in ms. defaults to false
 * @decorator
 * @namespace logging
 */
export function logAsync(level: number | boolean = LOGGER_LEVELS.DEBUG, benchmark?: boolean) {

    if (!benchmark && typeof level === 'boolean'){
        benchmark = level;
        level = LOGGER_LEVELS.DEBUG;
    }

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        const originalMethod = descriptor.value;

        const methodWrapper = function(this: any, ...args: any[]){
            let callback: Callback = args.pop();
            if (!callback || typeof callback !== 'function')
                throw new CriticalError(`Missing Callback`);

            const name = this.name && this.name !== 'Function' ? this.name : this.constructor && this.constructor.name || this;
            getLogger().report(`[{0}] - Entering Method {1} with args: {2}`, level as number, name, propertyKey, args.map(a => a.toString()).join(' | '));

            let stopWatch: StopWatch;

            const cb = (err: Err, ...results: any[]) => {
                if (stopWatch)
                    getLogger().report(`[{0}][BENCHMARK] - Leaving Method {1} after {2}ms`, level as number, name, propertyKey, stopWatch.stop());
                if (err){
                    getLogger().report(`[{0}][ERROR] - Leaving Method {1} with error {2}`, level as number, name, propertyKey, err);
                    return callback(err);
                }

                getLogger().report(`[{0}] - Leaving Method {1} with results: {2}`, level as number, name, propertyKey, results ? results.map(a => a.toString()).join(' | ') : "void");
                callback(undefined, ...results);
            }

            if (benchmark){
                stopWatch = new StopWatch();
                stopWatch.start();
            }

            originalMethod.call(this.__originalObject || this, ...args, cb);
        }

        descriptor.value = methodWrapper;
    }
}

/**
 * Sync Method decorator to log the input and output of that method
 *
 * @param {number} [level] Logging Level as in {@link LOGGER_LEVELS} defaults to {@link LOGGER_LEVELS.DEBUG}
 * @param {boolean} [benchmark] determines if the logging includes the duration in ms. defaults to false
 * @decorator
 * @namespace logging
 */
export function logSync(level: number | boolean = LOGGER_LEVELS.DEBUG, benchmark?: boolean) {

    if (!benchmark && typeof level === 'boolean'){
        benchmark = level;
        level = LOGGER_LEVELS.DEBUG;
    }

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        const originalMethod = descriptor.value;

        const methodWrapper = function(this: any, ...args: any[]){
            const name = this.name && this.name !== 'Function' ? this.name : this.constructor && this.constructor.name || this;

            getLogger().report(`[{0}] - Entering Method {1} with args: {2}`, level as number, name, propertyKey, args.map(a => a.toString()).join(' | '));
            let stopWatch: StopWatch | undefined = undefined;

            let result;
            if (benchmark){
                stopWatch = new StopWatch();
                stopWatch.start();
            }

            try {
                result = originalMethod.call(this.__originalObject || this, ...args);
            } catch (e) {
                if (stopWatch)
                    getLogger().report(`[{0}][BENCHMARK] - Leaving Method {1} after {2}ms`, level as number, name, propertyKey, stopWatch.stop());
                getLogger().report(`[{0}][ERROR] - Leaving Method {1} with error {2}`, level as number, name, propertyKey, e);
                throw e;
            }
            if (stopWatch)
                getLogger().report(`[{0}][BENCHMARK] - Leaving Method {1} after {2}ms`, level as number, name, propertyKey, stopWatch.stop());
            getLogger().report(`[{0}] - Leaving Method {1} with results: {2}`, level as number, name, propertyKey, result ? result : "void");
            return result;
        }

        descriptor.value = methodWrapper;
    }
}
