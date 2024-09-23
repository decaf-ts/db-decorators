import { IRepository } from "../interfaces/IRepository";
import { DBModel } from "../model/DBModel";
import { Constructor } from "@decaf-ts/decorator-validation";

export abstract class Repository<T extends DBModel> implements IRepository<T> {
  readonly clazz: Constructor<T>;

  protected constructor(clazz: Constructor<T>) {
    this.clazz = clazz;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(key: string, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  read(key?: string, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }
}
