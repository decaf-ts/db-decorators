import DBModel from "../model/DBModel";

/**
 * @interface IGenerator
 * @memberOf db-decorators.repository
 */
export interface IGenerator<T extends DBModel> {
    /**
     *
     * @param {T} model
     * @param {any[]} args
     */
    generate(model: T, ...args: any[]): any;
}

/**
 * @interface IGeneratorAsync
 * @memberOf db-decorators.repository
 */
export interface IGeneratorAsync<T extends DBModel> {
    /**
     *
     * @param {T} model
     * @param {any[]} args
     */
    generate(model: T, ...args: any[]): void;
}
