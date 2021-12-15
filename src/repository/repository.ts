import DBModel from "../model/DBModel";
import {
    enforceDBDecorators,
    getDbDecorators,
    prefixMethod,
    enforceDBDecoratorsAsync, wrapMethodAsync
} from "../utils";
import {OperationKeys} from "../operations";
import {criticalCallback, errorCallback, LoggedError} from "../errors";


/**
 * @typedef ModelOrCallback
 * @memberOf db-decorators.repository
 * */
export type ModelOrCallback<T extends DBModel> = T | ModelCallback<T>;

/**
 * @interface Repository
 * @memberOf db-decorators.repository
 */
export interface Repository<T extends DBModel> {
    /**
     * @param {any} key
     * @param {ModelOrCallback} model
     * @param {any[]} args
     * @return {T}
     */
    create(key?: any, model?: ModelOrCallback<T>, ...args: any[]): T;
    /**
     * @param {any} key
     * @param {any[]} args
     * @return {T}
     */
    read(key?: any, ...args: any[]): T;
    /**
     * @param {any} key
     * @param {ModelOrCallback} model
     * @param {any[]} args
     * @return {T}
     */
    update(key?: any, model?: ModelOrCallback<T>, ...args: any[]): T;
    /**
     * @param {any} key
     * @param {any[]} args
     */
    delete(key?: any, ...args: any[]): void;
}

/**
 * @interface AsyncRepository
 * @memberOf db-decorators.repository
 */
export interface AsyncRepository<T extends DBModel> {
    /**
     * @param {any} key
     * @param {ModelOrCallback} model
     * @param {any[]} args
     */
    create(key?: any, model?: ModelOrCallback<T>, ...args: any[]): void;
    /**
     * @param {any} key
     * @param {any[]} args
     */
    read(key?: any, ...args: any[]): void;
    /**
     * @param {any} key
     * @param {ModelOrCallback} model
     * @param {any[]} args
     */
    update(key?: any, model?: ModelOrCallback<T>, ...args: any[]): void;
    /**
     * @param {any} key
     * @param {any[]} args
     */
    delete(key?: any, ...args: any[]): void;
}
/**
 * @typedef Err
 * @memberOf db-decorators.repository
 * */
export type Err = Error | string | undefined;
/**
 * @typedef Callback
 * @memberOf db-decorators.repository
 * */
export type Callback = (err?: Err, ...args: any[]) => void;
/**
 * @typedef ModelCallback
 * @memberOf db-decorators.repository
 * */
export type ModelCallback<T extends DBModel> = (err?: Err, result?: T, ...args: any[]) => void;

export abstract class RepositoryImp<T extends DBModel> implements Repository<T>{
    private readonly clazz: {new(...args: any[]): T};

    constructor(clazz: {new(...args: any[]): T}) {
        this.clazz = clazz;
        prefixMethod(this, this.create, this.createPrefix, "create");
    }

    create(key?: any, model?: T, ...args: any[]): T {
        throw new LoggedError(`Child Classes must implement this!`);
    }

    protected createPrefix(key?: any, model?: T, ...args: any[]): any[] {
        if (!model)
            throw new LoggedError('Missing Model');
        const decorators = getDbDecorators(model, OperationKeys.CREATE, OperationKeys.ON);
        if (!decorators)
            return [key, model, ...args];
        try {
            model = enforceDBDecorators<T>(this, model, decorators);
        } catch (e) {
            throw new LoggedError(e);
        }

        return [key, model, ...args];
    }

    delete(key?: any, ...args: any[]): void {
        throw new LoggedError(`Child Classes must implement this!`);
    }

    read(key?: any, ...args: any[]): T {
        throw new LoggedError(`Child Classes must implement this!`);
    }

    update(key?: any, model?: T, ...args: any[]): T {
        throw new LoggedError(`Child Classes must implement this!`);
    }

    toString(){
        return JSON.stringify(this, undefined, 2);
    }
}

/**
 * trims the top of a list if its elements are undefined
 * @param {any[]} args
 * @return {any[]}
 *
 * @function trimLeftUndefined
 *
 * @memberOf db-decorators.repository
 */
export const trimLeftUndefined = function(...args: any[]){
    if (!args || !args.length)
        return args;
    while (args[0] === undefined){
        args.shift();
        if (!args.length)
            break;
    }
    return args;
}

/**
 * Base Async Repository Implementation
 *
 * To wire the on and after events, all CRUD methods will be prefixed/suffixed with their counterpart methods on initialization.
 *
 * This means that extending classes, if they have optional arguments must override the prefixes to handle them
 *
 * @class AsyncRepositoryImp
 * @implements AsyncRepository
 *
 * @memberOf db-decorators.repository
 */
export abstract class AsyncRepositoryImp<T extends DBModel> implements AsyncRepository<T>{
    readonly clazz: {new(...args: any[]): T};

    /**
     * @constructor
     * @param {{new: any}} clazz the class the repo is meant to instantiate
     */
    constructor(clazz: {new(...args: any[]): T}) {
        this.clazz = clazz;
        wrapMethodAsync(this, this.createPrefix, this.create, this.createSuffix, "create");
        wrapMethodAsync(this, this.readPrefix, this.read, this.readSuffix, "read");
        wrapMethodAsync(this, this.deletePrefix, this.delete, this.deleteSuffix, "delete");
        wrapMethodAsync(this, this.updatePrefix, this.update, this.updateSuffix, "update");
    }

    /**
     * Creates an object
     *
     * @param {any} [key]
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     */
    create(key?: any, model?: T, ...args: any[]): void {
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

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.ON, (err?: Err, newModel?: T | undefined) => {
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

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.AFTER, (err?: Err, newModel?: T | undefined) => {
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

            enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.ON, (err: Err) => {
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
        callback(undefined, key, ...args);
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

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.AFTER, (err: Err) => {
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
    update(key?: any, model?: T, ...args: any[]): void {
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

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.ON, (err: Err, newModel: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, key, newModel, ...args);
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

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.AFTER, (err: Err, newModel: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, newModel, ...args);
        });
    }

    toString(){
        return `${this.clazz ? this.clazz.name : "Async"} Repository`;
    }
}