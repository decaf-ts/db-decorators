export interface IRegistry<T>{
    register<T>(obj: T, ...args: any[]): void;
    get<T>(key: any, ...args: any[]): T | undefined;
}