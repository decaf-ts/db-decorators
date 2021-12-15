import DBModel from "../model/DBModel";

/**
 * @interface IGenerator
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
 */
export interface IGeneratorAsync<T extends DBModel> {
    /**
     *
     * @param {T} model
     * @param {any[]} args
     */
    generate(model: T, ...args: any[]): void;
}
