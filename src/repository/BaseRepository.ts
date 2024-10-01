import { IRepository } from "../interfaces/IRepository";
import { DBModel } from "../model/DBModel";
import { Constructor, sf } from "@decaf-ts/decorator-validation";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError } from "./errors";
import { DataCache } from "./DataCache";
import { wrapMethod } from "./wrappers";
import { findModelId } from "../identity";

export abstract class BaseRepository<T extends DBModel>
  implements IRepository<T>
{
  private readonly _class!: Constructor<T>;

  private _cache?: DataCache;

  get class() {
    if (!this._class)
      throw new InternalError(`No class definition found for this repository`);
    return this._class;
  }

  get cache(): DataCache {
    if (!this._cache) this._cache = new DataCache();
    return this._cache;
  }

  protected constructor(clazz?: Constructor<T>) {
    if (clazz) this._class = clazz;
    const self = this;
    [this.create, this.read, this.update, this.delete].forEach((m) => {
      const name = m.name;
      wrapMethod(
        self,
        (self as any)[name + "Prefix"],
        m,
        (self as any)[name + "Suffix"],
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  protected async createPrefix(model: T, ...args: any[]) {
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON,
    );
    return [model, ...args];
  }

  protected async createSuffix(model: T) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.AFTER,
    );
    return model;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async read(key: string, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  protected async readSuffix(model: T) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.READ,
      OperationKeys.AFTER,
    );
    return model;
  }

  protected async readPrefix(key: string, ...args: any[]) {
    const model: T = new this.class();
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.READ,
      OperationKeys.ON,
    );
    return [key, ...args];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  protected async updateSuffix(model: T) {
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.AFTER,
    );
    return model;
  }

  protected async updatePrefix(model: T, ...args: any[]) {
    const id = findModelId(model);
    const oldModel = await this.read(id);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
      oldModel,
    );
    return [model, ...args];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(key: string, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  protected async deleteSuffix(model: T) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.DELETE,
      OperationKeys.AFTER,
    );
    return model;
  }

  protected async deletePrefix(key: any, ...args: any[]) {
    const model = await this.read(key, ...args);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.DELETE,
      OperationKeys.ON,
    );
    return [key, ...args];
  }

  toString() {
    return sf(
      "[{0}] - Repository for {1}",
      this.constructor.name,
      this.class.name,
    );
  }
}
