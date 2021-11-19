import DBModel from "../model/DBModel";
import {enforceDBDecorators, getDbDecorators, prefixMethod, prefixMethodAsync, errorCallback, LoggedError} from "../utils";
import {OperationKeys} from "../operations";

export interface Repository<T extends DBModel> {
    create(model: T, ...args: any[]): T;
    read(key: any, ...args: any[]): T;
    update(key: any, model: T, ...args: any[]): T;
    delete(key: any, ...args: any[]): void;
}

export interface AsyncRepository<T extends DBModel> {
    create(model: T, ...args: any[]): void;
    read(key: any, ...args: any[]): void;
    update(key: any, model: T, ...args: any[]): void;
    delete(key: any, ...args: any[]): void;
}

export type Err = Error | string | undefined;

export type Callback = (err?: Err, ...args: any[]) => void;

export type ModelCallback<T extends DBModel> = (err?: Err, result?: T) => void;

export abstract class RepositoryImp<T extends DBModel> implements Repository<T>{
    private readonly clazz: {new(): T};

    constructor(clazz: {new(): T}) {
        this.clazz = clazz;
        prefixMethod(this, this.create, this._create);
    }

    create(model: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    _create(model: T, ...args: any[]): any[] {
        const decorators = getDbDecorators(model, OperationKeys.CREATE);
        if (!decorators)
            return [model, ...args];
        try {
            enforceDBDecorators<T>(model, decorators);
        } catch (e) {
            throw new LoggedError(e);
        }

        return [model, ...args];
    }

    delete(key: any, ...args: any[]): void {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    read(key: any, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }

    update(model: T, ...args: any[]): T {
        throw new LoggedError(new Error(`Child Classes must implement this!`));
    }
}

export abstract class AsyncRepositoryImp<T extends DBModel> implements AsyncRepository<T>{
    private readonly clazz: {new(): T};

    constructor(clazz: {new(): T}) {
        this.clazz = clazz;
        prefixMethodAsync(this, this.create, this._create);
    }

    /**
     *
     * @param {T} model Model object
     * @param {any[]} args optional Arguments. The last one must be the callback
     * @param {ModelCallback} callback Popped from args
     */
    create(model: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    _create(model: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        const decorators = getDbDecorators(model, OperationKeys.CREATE);
        if (!decorators)
            return callback(undefined, model, ...args);

        try{
            enforceDBDecorators<T>(model, decorators);
        } catch (e) {
            return errorCallback(e, callback);
        }

        callback(undefined, model, ...args);
    }

    delete(key: any, ...args: any[]): void {
        const callback: Callback = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    read(key: any, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }

    update(model: T, ...args: any[]): void {
        const callback: ModelCallback<T> = args.pop();
        errorCallback(new Error(`Child Classes must implement this!`), callback);
    }
}