import { IRepository } from "../interfaces/IRepository";
import { DBModel } from "../model/DBModel";
import { Constructor } from "@decaf-ts/decorator-validation";

export abstract class Repository<T extends DBModel> implements IRepository<T> {
  readonly clazz: Constructor<T>;

  protected constructor(clazz: Constructor<T>) {
    this.clazz = clazz;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  protected async createPrefix(model: T, ...args: any[]) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(key: string, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async read(key?: string, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }
}
