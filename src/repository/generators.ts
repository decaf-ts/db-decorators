import DBModel from "../model/DBModel";

export interface IGenerator<T extends DBModel> {
    generate(model: T, ...args: any[]): any;
}

export interface IGeneratorAsync<T extends DBModel> {
    generate(model: T, ...args: any[]): void;
}
