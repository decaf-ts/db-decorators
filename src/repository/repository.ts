import DBModel from "../model/DBModel";
import {
    enforceDBDecorators,
    getDbDecorators,
    prefixMethod,
    prefixMethodAsync,
    errorCallback,
    LoggedError,
    enforceDBDecoratorsAsync, criticalCallback, suffixMethodAsync
} from "../utils";
import {OperationKeys} from "../operations";

export interface Repository<T extends DBModel> {
    create(key?: any, model?: T, ...args: any[]): T;
    read(key?: any, ...args: any[]): T;
    update(key?: any, model?: T, ...args: any[]): T;
    delete(key?: any, ...args: any[]): void;
}

export interface AsyncRepository<T extends DBModel> {
    create(key?: any, model?: T, ...args: any[]): void;
    read(key?: any, ...args: any[]): void;
    update(key?: any, model?: T, ...args: any[]): void;
    delete(key?: any, ...args: any[]): void;
}

export type Err = Error | string | undefined;

export type Callback = (err?: Err, ...args: any[]) => void;

export type ModelCallback<T extends DBModel> = (err?: Err, result?: T, ...args: any[]) => void;

export abstract class RepositoryImp<T extends DBModel> implements Repository<T>{
    private readonly clazz: {new(): T};

    constructor(clazz: {new(): T}) {
        this.clazz = clazz;
        prefixMethod(this, this.create, this.createPrefix, "create");
    }

    create(key?: any, model?: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    protected createPrefix(key?: any, model?: T, ...args: any[]): any[] {
        if (!model)
            throw new LoggedError(new Error('Missing Model'));
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
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    read(key?: any, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    update(key?: any, model?: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }
}

/**
 * @typedef T extends DBModel
 */
export abstract class AsyncRepositoryImp<T extends DBModel> implements AsyncRepository<T>{
    protected readonly clazz: {new(): T};

    constructor(clazz: {new(): T}) {
        this.clazz = clazz;
        // suffixMethodAsync(this, this.create, this.createSuffix, "create");
        prefixMethodAsync(this, this.create, this.createPrefix, "create");

        // suffixMethodAsync(this, this.read, this.readSuffix, "read");
        prefixMethodAsync(this, this.read, this.readPrefix, "read");

        // suffixMethodAsync(this, this.delete, this.deleteSuffix, "delete");
        prefixMethodAsync(this, this.delete, this.deletePrefix, "delete");

        // suffixMethodAsync(this, this.update, this.updateSuffix, "update");
        prefixMethodAsync(this, this.update, this.updatePrefix, "update");
    }

    /**
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

    protected createPrefix(key?: any, model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));

        const decorators = getDbDecorators(model, OperationKeys.CREATE, OperationKeys.ON);
        if (!decorators)
            return callback(undefined, key, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.ON, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, key, newModel, ...args);
        });
    }

    protected createSuffix(model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));

        const decorators = getDbDecorators(model, OperationKeys.CREATE, OperationKeys.AFTER);
        if (!decorators)
            return callback(undefined, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.AFTER, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, newModel, ...args);
        });
    }

    delete(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    protected deletePrefix(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!key)
            return callback(new Error(`Missing Key`));

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

    protected deleteSuffix(...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);

        // TODO - cant access decorators from here
        callback(undefined, ...args);
    }

    read(key?: any, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    protected readPrefix(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        callback(undefined, key, ...args);
    }

    protected readSuffix(model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        if (!model)
            return callback(new Error(`Missing Model`));
        callback(undefined, model, ...args);
    }

    update(key?: any, model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        if (!callback)
            throw new LoggedError(`Missing Callback`);
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

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
}