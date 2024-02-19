import {Callback, criticalCallback, Err, errorCallback, LoggedError, warn} from "@glass-project1/logging";
import {DBModel} from "../../model";
import {transactionAwareWrapMethodAsync} from "../../utils/transactionAwareWrappers";
import {AsyncRepository, ModelCallback} from "../core/types";
import {enforceDBDecoratorsAsync, getDbDecorators} from "../core/utilities";
import {OperationKeys} from "../core/operations/constants";
import {Transaction} from "../core/transactions";
import {Constructor} from "@glass-project1/decorator-validation";

/**
 * @summary trims the top of a list if its elements are undefined
 * @param {any[]} args
 * @return {any[]}
 *
 * @function trimLeftUndefined
 *
 * @memberOf module:db-decorators.Repository
 */
export const trimLeftUndefined = function (...args: any[]) {
    if (!args || !args.length)
        return args;
    while (args[0] === undefined) {
        args.shift();
        if (!args.length)
            break;
    }
    return args;
}

/**
 * @summary Base Async Repository Implementation
 *
 * @description To wire the on and after events, all CRUD methods will be prefixed/suffixed with their counterpart methods on initialization.
 *
 * This means that extending classes, if they have optional arguments must override the prefixes to handle them
 *
 * @param {{new: any}} clazz the class the repo is meant to instantiate
 *
 * @class AsyncRepositoryImp
 * @implements AsyncRepository
 *
 * @category Repository
 */
export abstract class AsyncRepositoryImp<T extends DBModel> implements AsyncRepository<T> {
    readonly clazz: Constructor<T>;

    protected constructor(clazz: Constructor<T>) {
        this.clazz = clazz;
        transactionAwareWrapMethodAsync(this, this.createPrefix, this.create, this.createSuffix, "create");
        transactionAwareWrapMethodAsync(this, this.readPrefix, this.read, this.readSuffix, "read");
        transactionAwareWrapMethodAsync(this, this.deletePrefix, this.delete, this.deleteSuffix, "delete");
        transactionAwareWrapMethodAsync(this, this.updatePrefix, this.update, this.updateSuffix, "update");
    }

    /**
     * Creates an object
     *
     * @param {any} [key]
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     */
    create(key?: any, model?: T | any, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    /**
     * Method that will prefix the actual create method to wire the 'on' event logic
     *
     * @param {any} [key]
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     *
     * @protected
     */
    protected createPrefix(key?: any, model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));

        const decorators = getDbDecorators(model, OperationKeys.CREATE, OperationKeys.ON);
        if (!decorators)
            return callback(undefined, ...trimLeftUndefined(key, model, ...args));

        enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.ON, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, ...trimLeftUndefined(key, newModel, ...args));
        });
    }

    /**
     * Method that will suffix the actual create method to wire the 'after' event logic
     *
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     *
     * @protected
     */
    protected createSuffix(model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));

        const decorators = getDbDecorators(model, OperationKeys.CREATE, OperationKeys.AFTER);
        if (!decorators)
            return callback(undefined, ...trimLeftUndefined(model, ...args));

        enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.AFTER, ...args, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, ...trimLeftUndefined(newModel, ...args));
        });
    }

    /**
     * Deletes an object
     *
     * @param {any} [key]
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link Callback} callback Popped from args
     */
    delete(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    /**
     * Method that will prefix the actual delete method to wire the 'on' event logic
     *
     * @param {any} [key]
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link Callback} callback Popped from args
     *
     * @protected
     */
    protected deletePrefix(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!key)
            return errorCallback(new Error(`Missing Key`), callback);

        this.read(key, (err?: Err, model?: T) => {
            if (err)
                return errorCallback(new Error(`Could not find DSU to delete`), callback);
            if (!model)
                return errorCallback(new Error(`Could not load model`), callback);

            const decorators = getDbDecorators(model, OperationKeys.DELETE, OperationKeys.ON);
            if (!decorators)
                return callback(undefined, key, ...args);

            enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.ON, (err: Err) => {
                if (err)
                    return criticalCallback(err, callback);
                callback(undefined, key, ...args);
            });
        });
    }

    /**
     * Method that will suffix the actual delete method to wire the 'after' event logic
     *
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     *
     * @protected
     */
    protected deleteSuffix(...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);

        // TODO - cant access decorators from here
        callback(undefined, ...args);
    }

    /**
     * Reads an object
     *
     * @param {any} [key]
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     */
    read(key?: any, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    /**
     * Method that will prefix the actual read method to wire the 'on' event logic
     *
     * @param {any} [key]
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link Callback} callback Popped from args
     *
     * @protected
     */
    protected readPrefix(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);

        let model: T;

        try{
            model = new this.clazz();
        } catch (e) {
            warn.call(this, "Unable to instantiate Model to retrieve decorators. Skipping onRead phase");
            return callback(undefined, key, ...args);
        }

        const decorators = getDbDecorators(model, OperationKeys.READ, OperationKeys.ON);
        if (!decorators)
            return callback(undefined, key, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.ON, (err: Err) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, key, ...args);
        });
    }

    /**
     * Method that will suffix the actual read method to wire the 'after' event logic
     *
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     *
     * @protected
     */
    protected readSuffix(model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return errorCallback(new Error(`Could not read model`), callback);

        const decorators = getDbDecorators(model, OperationKeys.READ, OperationKeys.AFTER);
        if (!decorators)
            return callback(undefined, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.AFTER, ...args, (err: Err) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, model, ...args);
        });
    }

    /**
     * Updates an object
     *
     * @param {any} [key]
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     */
    update(key?: any, model?: T | any, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    /**
     * Method that will prefix the actual update method to wire the 'on' event logic
     *
     * @param {any} [key]
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     *
     * @protected
     */
    protected updatePrefix(key?: any, model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));

        const decorators = getDbDecorators(model, OperationKeys.UPDATE, OperationKeys.ON);
        if (!decorators)
            return callback(undefined, key, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.ON, (err: Err, newModel: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, ...trimLeftUndefined(key, newModel, ...args));
        });
    }

    /**
     * Method that will suffix the actual create method to wire the 'after' event logic
     *
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     *
     * @protected
     */
    protected updateSuffix(model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));

        const decorators = getDbDecorators(model, OperationKeys.UPDATE, OperationKeys.AFTER);
        if (!decorators)
            return callback(undefined, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators as unknown as {[indexer: string]: any[]}, OperationKeys.AFTER, ...args, (err: Err, newModel: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, ...trimLeftUndefined(newModel, ...args));
        });
    }

    toString() {
        return `${this.clazz ? this.clazz.name : "Async"} Repository`;
    }
}