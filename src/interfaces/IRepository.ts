import { DBModel } from "../model/DBModel";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link DBModel}
 * @interface IRepository
 */
export interface IRepository<T extends DBModel> {
  /**
   * @summary creates a new model
   * @param {T} model
   * @param {any[]} args
   * @method
   */
  create(model: T, ...args: any[]): Promise<T>;

  /**
   * @summary retrieves a model from his primary key
   * @param {string} key
   * @param {any[]} args
   * @method
   * @see {pk}
   */
  read(key?: string, ...args: any[]): Promise<T>;

  /**
   * @summary updates a model
   * @param {T} model
   * @param {any[]} args
   * @method
   */
  update(model: T, ...args: any[]): Promise<T>;

  /**
   * @summary deletes a model
   * @param {string} key
   * @param {any[]} args
   * @method
   */
  delete(key: string, ...args: any[]): Promise<T>;
}
