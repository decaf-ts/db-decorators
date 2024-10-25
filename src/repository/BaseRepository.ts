import { IRepository } from "../interfaces/IRepository";
import { Constructor, Model, sf } from "@decaf-ts/decorator-validation";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError } from "./errors";
import { wrapMethodWithContext } from "./wrappers";
import { findPrimaryKey } from "../identity/utils";
import { Context } from "./Context";

export abstract class BaseRepository<M extends Model>
  implements IRepository<M>
{
  private readonly _class!: Constructor<M>;
  private _pk!: string;

  get class() {
    if (!this._class)
      throw new InternalError(`No class definition found for this repository`);
    return this._class;
  }

  protected get pk() {
    if (!this._pk) this._pk = findPrimaryKey(new this.class()).id;
    return this._pk;
  }

  protected constructor(clazz?: Constructor<M>) {
    if (clazz) this._class = clazz;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    [this.create, this.read, this.update, this.delete].forEach((m) => {
      const name = m.name;
      wrapMethodWithContext(
        self,
        (self as any)[name + "Prefix"],
        m,
        (self as any)[name + "Suffix"]
      );
    });
  }

  async timestamp() {
    return new Date();
  }

  async context() {
    return new Context();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: M, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this.");
  }

  async createAll(models: M[], ...args: any[]): Promise<M[]> {
    const contextArgs = await Context.fromArgs(this, args);
    return Promise.all(models.map((m) => this.create(m, ...contextArgs.args)));
  }

  protected async createPrefix(model: M, ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      contextArgs.context,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON
    );
    return [model, ...contextArgs.args];
  }

  protected async createSuffix(model: M, context: Context) {
    await enforceDBDecorators(
      this,
      context,
      model,
      OperationKeys.CREATE,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async createAllPrefix(models: M[], ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    await Promise.all(
      models.map(async (m) => {
        m = new this.class(m);
        await enforceDBDecorators(
          this,
          contextArgs.context,
          m,
          OperationKeys.CREATE,
          OperationKeys.ON
        );
        return m;
      })
    );
    return [models, ...contextArgs.args];
  }

  protected async createAllSuffix(models: M[], context: Context) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(
          this,
          context,
          m,
          OperationKeys.CREATE,
          OperationKeys.AFTER
        )
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

  protected async readSuffix(model: M, context: Context) {
    await enforceDBDecorators(
      this,
      context,
      model,
      OperationKeys.READ,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async readPrefix(key: string, ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    const model: M = new this.class();
    (model as Record<string, any>)[this.pk] = key;
    await enforceDBDecorators(
      this,
      contextArgs.context,
      model,
      OperationKeys.READ,
      OperationKeys.ON
    );
    return [key, ...contextArgs.args];
  }

  protected async readAllPrefix(keys: string[] | number[], ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    await Promise.all(
      keys.map(async (k) => {
        const m = new this.class();
        (m as Record<string, any>)[this.pk] = k;
        return enforceDBDecorators(
          this,
          contextArgs.context,
          m,
          OperationKeys.READ,
          OperationKeys.ON
        );
      })
    );
    return [keys, ...contextArgs.args];
  }

  protected async readAllSuffix(models: M[], context: Context) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(
          this,
          context,
          m,
          OperationKeys.READ,
          OperationKeys.AFTER
        )
      )
    );
    return models;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: M, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this");
  }

  async updateAll(models: M[], ...args: any): Promise<M[]> {
    const contextArgs = await Context.fromArgs(this, args);
    return Promise.all(models.map((m) => this.update(m, ...contextArgs.args)));
  }

  protected async updateSuffix(model: M, context: Context) {
    await enforceDBDecorators(
      this,
      context,
      model,
      OperationKeys.UPDATE,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async updatePrefix(model: M, ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    const id = (model as any)[this.pk];
    if (!id)
      throw new InternalError(
        `No value for the Id is defined under the property ${this.pk}`
      );
    const oldModel = await this.read(id);
    await enforceDBDecorators(
      this,
      contextArgs.context,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
      oldModel
    );
    return [model, ...contextArgs.args];
  }

  protected async updateAllPrefix(models: M[], ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    await Promise.all(
      models.map((m) => {
        m = new this.class(m);
        enforceDBDecorators(
          this,
          contextArgs.context,
          m,
          OperationKeys.UPDATE,
          OperationKeys.ON
        );
        return m;
      })
    );
    return [models, ...contextArgs.args];
  }

  protected async updateAllSuffix(models: M[], context: Context) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(
          this,
          context,
          m,
          OperationKeys.UPDATE,
          OperationKeys.AFTER
        )
      )
    );
    return models;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(key: string | number, ...args: any[]): Promise<M> {
    throw new Error("Child classes must implement this");
  }

  async deleteAll(keys: string[] | number[], ...args: any[]): Promise<M[]> {
    const contextArgs = await Context.fromArgs(this, args);
    return Promise.all(keys.map((k) => this.delete(k, ...contextArgs.args)));
  }

  protected async deleteSuffix(model: M, context: Context) {
    await enforceDBDecorators(
      this,
      context,
      model,
      OperationKeys.DELETE,
      OperationKeys.AFTER
    );
    return model;
  }

  protected async deletePrefix(key: any, ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    const model = await this.read(key, ...contextArgs.args);
    await enforceDBDecorators(
      this,
      contextArgs.context,
      model,
      OperationKeys.DELETE,
      OperationKeys.ON
    );
    return [key, ...contextArgs.args];
  }

  protected async deleteAllPrefix(keys: string[] | number[], ...args: any[]) {
    const contextArgs = await Context.fromArgs(this, args);
    const models = await this.readAll(keys, ...contextArgs.args);
    await Promise.all(
      models.map(async (m) => {
        return enforceDBDecorators(
          this,
          contextArgs.context,
          m,
          OperationKeys.DELETE,
          OperationKeys.ON
        );
      })
    );
    return [keys, ...contextArgs.args];
  }

  protected async deleteAllSuffix(models: M[], context: Context) {
    await Promise.all(
      models.map((m) =>
        enforceDBDecorators(
          this,
          context,
          m,
          OperationKeys.DELETE,
          OperationKeys.AFTER
        )
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
