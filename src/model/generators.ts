import {DBModel} from "./DBModel";
import {AsyncRepository, Repository} from "../repository";

/**
 * @summary generic generator interface
 * @interface IGenerator
 *
 * @category Model
 */
export interface IGenerator<T extends DBModel> {
    /**
     * @summary generates a new value
     * @param {Repository} repo
     * @param {T} model
     * @param {any[]} args
     *
     * @method
     */
    generate(repo: Repository<T>, model: T, ...args: any[]): any;
}

/**
 * @summary generic async generator interface
 * @interface IGeneratorAsync
 * @category Model
 */
export interface IGeneratorAsync<T extends DBModel> {
    /**
     * @summary generates a new valu
     * @param {AsyncRepository} repo
     * @param {T} model
     * @param {any[]} args
     * @method
     */
    generate(repo: AsyncRepository<T>, model: T, ...args: any[]): void;
}

/**
 * @summary Groups both sync and Async generators in a type
 * @memberOf module:db-decorators.Model
 */
export type Generators<T extends DBModel> = { new(): IGenerator<T> | IGeneratorAsync<T> };