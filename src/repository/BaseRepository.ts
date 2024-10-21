import { IRepository } from "../interfaces/IRepository";
import { Constructor, Model, sf } from "@decaf-ts/decorator-validation";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError } from "./errors";
import { DataCache } from "./DataCache";
import { wrapMethod } from "./wrappers";
import { findModelId, findPrimaryKey } from "../identity/utils";

export abstract class BaseRepository<M extends Model>
  implements IRepository<M>
{
  private readonly _class!: Constructor<M>;

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

  protected constructor(clazz?: Constructor<M>) {
    if (clazz) this._class = clazz;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    [this.create, this.read, this.update, this.delete].forEach((m) => {
      const name = m.name;
      wrapMethod(
        self,
        (self as any)[name + "Prefix"],
        m,
        (self as any)[name + "Suffix"]
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: M, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this.");
  }

  async createAll(models: M[], ...args: any[]): Promise<M[]> {
    return Promise.all(models.map((m) => this.create(m, ...args)));
  }

  protected async createPrefix(model: M, ...args: any[]) {
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON
    );
    return [model, ...args];
  }

  protected async createSuffix(model: M) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async createAllPrefix(models: M[], ...args: any[]) {
    await Promise.all(
      models.map(async (m) => {
        m = new this.class(m);
        await enforceDBDecorators(
          this,
          m,
          OperationKeys.CREATE,
          OperationKeys.ON
        );
        return m;
      })
    );
    return [models, ...args];
  }

  protected async createAllSuffix(models: M[]) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(this, m, OperationKeys.CREATE, OperationKeys.AFTER)
      )
    );
    return models;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async read(key: string | number, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this");
  }

  async readAll(keys: string[] | number[], ...args: any[]): Promise<M[]> {
    return await Promise.all(keys.map((id) => this.read(id, ...args)));
  }

  protected async readSuffix(model: M) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.READ,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async readPrefix(key: string, ...args: any[]) {
    const model: M = new this.class();
    const pk = findPrimaryKey(model).id;
    (model as Record<string, any>)[pk] = key;
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.READ,
      OperationKeys.ON
    );
    return [key, ...args];
  }

  protected async readAllPrefix(keys: string[] | number[], ...args: any[]) {
    const model: M = new this.class();
    const pk = findPrimaryKey(model).id;
    await Promise.all(
      keys.map(async (k) => {
        const m = new this.class();
        (m as Record<string, any>)[pk] = k;
        return enforceDBDecorators(
          this,
          m,
          OperationKeys.READ,
          OperationKeys.ON
        );
      })
    );
    return [keys, ...args];
  }

  protected async readAllSuffix(models: M[]) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(this, m, OperationKeys.READ, OperationKeys.AFTER)
      )
    );
    return models;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: M, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this");
  }

  async updateAll(models: M[], ...args: any): Promise<M[]> {
    return Promise.all(models.map((m) => this.update(m, ...args)));
  }

  protected async updateSuffix(model: M) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async updatePrefix(model: M, ...args: any[]) {
    const id = findModelId(model);
    const oldModel = await this.read(id);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
      oldModel
    );
    return [model, ...args];
  }

  protected async updateAllPrefix(models: M[], ...args: any[]) {
    await Promise.all(
      models.map((m) => {
        m = new this.class(m);
        enforceDBDecorators(this, m, OperationKeys.UPDATE, OperationKeys.ON);
        return m;
      })
    );
    return [models, ...args];
  }

  protected async updateAllSuffix(models: M[]) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(this, m, OperationKeys.UPDATE, OperationKeys.AFTER)
      )
    );
    return models;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(key: string | number, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this");
  }

  async deleteAll(keys: string[] | number[], ...args: any[]): Promise<M[]> {
    return Promise.all(keys.map((k) => this.delete(k, ...args)));
  }

  protected async deleteSuffix(model: M) {
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.DELETE,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async deletePrefix(key: any, ...args: any[]) {
    const model = await this.read(key, ...args);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.DELETE,
      OperationKeys.ON
    );
    return [key, ...args];
  }

  protected async deleteAllPrefix(keys: string[] | number[], ...args: any[]) {
    const models = await this.readAll(keys, ...args);
    await Promise.all(
      models.map(async (m) => {
        return enforceDBDecorators(
          this,
          m,
          OperationKeys.DELETE,
          OperationKeys.ON
        );
      })
    );
    return [keys, ...args];
  }

  protected async deleteAllSuffix(models: M[]) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(this, m, OperationKeys.DELETE, OperationKeys.AFTER)
      )
    );
    return models;
  }

  protected merge(oldModel: M, model: M): M {
    const extract = (model: M) =>
      Object.entries(model).reduce((accum: Record<string, any>, [key, val]) => {
        if (typeof val !== "undefined") accum[key] = val;
        return accum;
      }, {});

    return new this.class(Object.assign({}, extract(oldModel), extract(model)));
  }

  toString() {
    return sf(
      "[{0}] - Repository for {1}",
      this.constructor.name,
      this.class.name
    );
  }
}
