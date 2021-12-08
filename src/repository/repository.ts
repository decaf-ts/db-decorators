import DBModel from "../model/DBModel";
import {
    enforceDBDecorators,
    getDbDecorators,
    prefixMethod,
    enforceDBDecoratorsAsync, wrapMethodAsync
} from "../utils";
import {OperationKeys} from "../operations";
import {criticalCallback, errorCallback, LoggedError} from "../errors";

export type ModelOrCallback<T extends DBModel> = T | ModelCallback<T>;

export interface Repository<T extends DBModel> {
    create(key?: any, model?: ModelOrCallback<T>, ...args: any[]): T;
    read(key?: any, ...args: any[]): T;
    update(key?: any, model?: ModelOrCallback<T>, ...args: any[]): T;
    delete(key?: any, ...args: any[]): void;
}

export interface AsyncRepository<T extends DBModel> {
    create(key?: any, model?: ModelOrCallback<T>, ...args: any[]): void;
    read(key?: any, ...args: any[]): void;
    update(key?: any, model?: ModelOrCallback<T>, ...args: any[]): void;
    delete(key?: any, ...args: any[]): void;
}

export type Err = Error | string | undefined;

export type Callback = (err?: Err, ...args: any[]) => void;

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
 * @typedef T extends DBModel
 */
export abstract class AsyncRepositoryImp<T extends DBModel> implements AsyncRepository<T>{
    readonly clazz: {new(...args: any[]): T};

    constructor(clazz: {new(...args: any[]): T}) {
        this.clazz = clazz;
        wrapMethodAsync(this, this.createPrefix, this.create, this.createSuffix, "create");
        wrapMethodAsync(this, this.readPrefix, this.read, this.readSuffix, "read");
        wrapMethodAsync(this, this.deletePrefix, this.delete, this.deleteSuffix, "delete");
        wrapMethodAsync(this, this.updatePrefix, this.update, this.updateSuffix, "update");
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
            return callback(undefined, ...trimLeftUndefined(key, model, ...args));

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.ON, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, ...trimLeftUndefined(key, newModel, ...args));
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
            return callback(undefined, ...trimLeftUndefined(model, ...args));

        enforceDBDecoratorsAsync<T>(this, model, decorators, OperationKeys.AFTER, (err?: Err, newModel?: T | undefined) => {
            if (err)
                return criticalCallback(err, callback);
            callback(undefined, ...trimLeftUndefined(newModel, ...args));
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

    toString(){
        return `${this.clazz ? this.clazz.name : "Async"} Repository`;
    }
}