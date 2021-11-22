import DBModel from "../model/DBModel";
import {
    enforceDBDecorators,
    getDbDecorators,
    prefixMethod,
    prefixMethodAsync,
    errorCallback,
    LoggedError,
    enforceDBDecoratorsAsync
} from "../utils";
import {OperationKeys} from "../operations";

export type DbKey = string | number;

export interface Repository<T extends DBModel> {
    create(key?: DbKey, model?: T, ...args: any[]): T;
    read(key?: DbKey, ...args: any[]): T;
    update(key?: DbKey, model?: T, ...args: any[]): T;
    delete(key?: DbKey, ...args: any[]): void;
}

export interface AsyncRepository<T extends DBModel> {
    create(key?: DbKey, model?: T, ...args: any[]): void;
    read(key?: DbKey, ...args: any[]): void;
    update(key?: DbKey, model?: T, ...args: any[]): void;
    delete(key?: DbKey, ...args: any[]): void;
}

export type Err = Error | string | undefined;

export type Callback = (err?: Err, ...args: any[]) => void;

export type ModelCallback<T extends DBModel> = (err?: Err, result?: T) => void;

export abstract class RepositoryImp<T extends DBModel> implements Repository<T>{
    private readonly clazz: {new(): T};

    constructor(clazz: {new(): T}) {
        this.clazz = clazz;
        prefixMethod(this, this.create, this._create, "create");
    }

    create(key?: DbKey, model?: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    _create(key?: DbKey, model?: T, ...args: any[]): any[] {
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

    delete(key?: DbKey, ...args: any[]): void {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    read(key?: DbKey, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    update(key?: DbKey, model?: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }
}

/**
 * @typedef T extends DBModel
 */
export abstract class AsyncRepositoryImp<T extends DBModel> implements AsyncRepository<T>{
    private readonly clazz: {new(): T};

    constructor(clazz: {new(): T}) {
        this.clazz = clazz;
        prefixMethodAsync(this, this.create, this._create, "create");
    }

    /**
     *
     * @param {any} [key]
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * implicit @param {@link ModelCallback} callback Popped from args
     */
    create(key?: DbKey, model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    private _create(key?: DbKey, model?: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        if (!model)
            return callback(new Error(`Missing Model`));
        // @ts-ignore
        model = new (this.clazz)(model);
        const decorators = getDbDecorators(model, OperationKeys.CREATE);
        if (!decorators)
            return callback(undefined, model, ...args);

        enforceDBDecoratorsAsync<T>(this, model, decorators, (err: Err, newModel: T | undefined) => {
            if (err)
                return errorCallback(err, callback);
            callback(undefined, key, newModel, ...args);
        });
    }

    delete(key?: DbKey, ...args: any[]): void {
        const callback: Callback = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    read(key?: DbKey, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    update(key?: DbKey, model?: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }
}