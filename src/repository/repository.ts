import DBModel from "../model/DBModel";
import {
    enforceDBDecorators,
    getDbDecorators,
    prefixMethod,
    prefixMethodAsync,
    errorCallback,
    LoggedError,
    enforceDBDecoratorsAsync, criticalCallback
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
        prefixMethod(this, this.create, this._create, "create");
    }

    create(key?: any, model?: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    protected _create(key?: any, model?: T, ...args: any[]): any[] {
        if (!model)
            throw new LoggedError(new Error('Missing Model'));
        const decorators = getDbDecorators(model, OperationKeys.CREATE);
        if (!decorators)
            return [model, ...args];
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
        prefixMethodAsync(this, this.create, this._create, "create");
        prefixMethodAsync(this, this.read, this._read, "read");
        prefixMethodAsync(this, this.delete, this._delete, "delete");
        prefixMethodAsync(this, this.update, this._update, "update");
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

    protected _create(key?: any, model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!model)
            return callback(new Error(`Missing Model`));
        // @ts-ignore
        model = new (this.clazz)(model);
        const decorators = getDbDecorators(model, OperationKeys.CREATE);
        if (!decorators)
            return callback(undefined, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, key, newModel, ...args);
        });
    }

    delete(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    protected _delete(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!key)
            return callback(new Error(`Missing Key`));

        this.read(key, (err?: Err, model?: T) => {
            if (err)
                return errorCallback(`Could not find DSU to delete`, callback);
            if (!model)
                return errorCallback(`Could not load model`, callback);

            const decorators = getDbDecorators(model, OperationKeys.DELETE);
            if (!decorators)
                return callback(undefined, model, ...args);

            enforceDBDecoratorsAsync<T>(this, model, decorators, (err: Err, newModel: T | undefined) => {
                if (err)
                    return criticalCallback(err, callback);
                callback(undefined, key, newModel, ...args);
            });
        });
    }

    read(key?: any, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    protected _read(key?: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        callback(undefined, key, ...args);
    }

    update(key?: any, model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    protected _update(key?: any, model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!model)
            return callback(new Error(`Missing Model`));
        // // @ts-ignore
        // model = new (this.clazz)(model);
        const decorators = getDbDecorators(model, OperationKeys.UPDATE);
        if (!decorators)
            return callback(undefined, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators, (err: Err, newModel: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, key, newModel, ...args);
        });
    }
}