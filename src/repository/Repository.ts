import { IRepository } from "../interfaces/IRepository";
import { DBModel } from "../model/DBModel";
import { Constructor } from "@decaf-ts/decorator-validation";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError, ValidationError } from "./errors";
import { DataCache } from "./DataCache";

export abstract class Repository<T extends DBModel> implements IRepository<T> {
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

  protected constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  protected async createPrefix(model: T, ...args: any[]) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON,
    );

    const errors = model.hasErrors();
    if (errors) throw new ValidationError(errors.toString());

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
      OperationKeys.DELETE,
      OperationKeys.ON,
    );
    return [key, ...args];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: T, ...args: any[]): Promise<T> {
    throw new Error("Child classes must implement this");
  }

  protected async updateSuffix(model: T) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.AFTER,
    );
    return model;
  }

  protected async updatePrefix(model: T, ...args: any[]) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
    );

    const pk = "";

    const oldModel = await this.read(pk);
    const errors = model.hasErrors(oldModel);
    if (errors) throw new ValidationError(errors.toString());
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
    return this.constructor.name;
  }
}
