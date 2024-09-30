import { IRepository } from "../interfaces/IRepository";
import { DBModel } from "../model/DBModel";
import { Constructor } from "@decaf-ts/decorator-validation";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError, ObserverError } from "./errors";
import { DataCache } from "./DataCache";
import { getDBKey } from "../model/decorators";
import { DBKeys } from "../model/constants";
import { Observable } from "../interfaces/Observable";
import { Observer } from "../interfaces/Observer";
import { wrapMethod } from "./wrappers";

export abstract class Repository<T extends DBModel>
  implements IRepository<T>, Observable
{
  private readonly _class!: Constructor<T>;

  private observers!: Observer[];

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

  protected constructor() {
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
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
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

  /**
   * @summary Registers an {@link Observer}
   * @param {Observer} observer
   *
   * @see {Observable#observe}
   */
  observe(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) throw new InternalError("Observer already registered");
    this.observers.push(observer);
  }

  /**
   * @summary Unregisters an {@link Observer}
   * @param {Observer} observer
   *
   * @see {Observable#unObserve}
   */
  unObserve(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index === -1) throw new InternalError("Failed to find Observer");
    this.observers.splice(index, 1);
  }

  /**
   * @summary calls all registered {@link Observer}s to update themselves
   * @param {any[]} [args] optional arguments to be passed to the {@link Observer#refresh} method
   */
  async updateObservers(...args: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Promise.all(this.observers.map((o: Observer) => o.refresh(...args)))
        .then(() => {
          resolve();
        })
        .catch((e: any) => reject(new ObserverError(e)));
    });
  }

  toString() {
    return this.constructor.name;
  }
}
