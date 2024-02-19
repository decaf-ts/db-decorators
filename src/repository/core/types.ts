import {Err} from "@glass-project1/logging";
import {DBModel} from "../../model";

/**
 * @summary Model or Model callback type
 * @memberOf module:db-decorators.Repository
 */
export type ModelOrCallback<T extends DBModel> = T | ModelCallback<T>;

/**
 * @summary Generic Repository interface
 * @description used by both sync and async versions
 * @interface Repository
 *
 * @category Repository
 */
export interface Repository<T extends DBModel> {
    /**
     * @summary create a model
     * @param {any} key
     * @param {ModelOrCallback} model
     * @param {any[]} args
     * @return {T}
     * @method
     */
    create(key?: any, model?: ModelOrCallback<T>, ...args: any[]): T;

    /**
     * @summary reads a model
     * @param {any} key
     * @param {any[]} args
     * @return {T}
     * @method
     */
    read(key?: any, ...args: any[]): T;

    /**
     * @summary updates a model
     * @param {any} key
     * @param {ModelOrCallback} model
     * @param {any[]} args
     * @return {T}
     * @method
     */
    update(key?: any, model?: ModelOrCallback<T>, ...args: any[]): T;

    /**
     * @summary deletes a model
     * @param {any} key
     * @param {any[]} args
     * @method
     */
    delete(key?: any, ...args: any[]): void;
}

/**
 * @summary Async repo interface
 * @interface AsyncRepository
 *
 * @category Repository
 */
export interface AsyncRepository<T extends DBModel> {
    /**
     * @inheritDoc
     */
    create(key?: any, model?: ModelOrCallback<T>, ...args: any[]): void;

    /**
     * @inheritDoc
     */
    read(key?: any, ...args: any[]): void;

    /**
     * @inheritDoc
     */
    update(key?: any, model?: ModelOrCallback<T>, ...args: any[]): void;

    /**
     * @inheritDoc
     */
    delete(key?: any, ...args: any[]): void;
}

/**
 * @summary modelcallback callback
 * @memberOf module:db-decorators.Repository
 * */
export type ModelCallback<T extends DBModel> = (err?: Err, result?: T, ...args: any[]) => void;