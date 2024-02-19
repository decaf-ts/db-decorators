import {LoggedError} from "@glass-project1/logging";
import {DBModel} from "../../model";
import {prefixMethod} from "../../utils";
import {enforceDBDecorators, getDbDecorators, OperationKeys, Repository} from "../core";

/**
 * @summary Base Sync Repository Implementation
 *
 * @class RepositoryImp
 * @implements Repository
 *
 * @category Repository
 */
export abstract class RepositoryImp<T extends DBModel> implements Repository<T> {
    private readonly clazz: { new(...args: any[]): T };

    protected constructor(clazz: { new(...args: any[]): T }) {
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
            model = enforceDBDecorators<T>(this, model, decorators as unknown as {[indexer: string]: any[]});
        } catch (e: any) {
            throw new LoggedError(e as Error);
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

    toString() {
        return JSON.stringify(this, undefined, 2);
    }
}