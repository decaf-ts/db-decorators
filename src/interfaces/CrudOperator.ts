/**
 * @summary Crud API
 * @description Exposes a CRUD API
 *
 * @interface CrudOperator
 *
 * @category Managers
 */
export interface CrudOperator<T> {
  /**
   * @summary Create a new model
   * @param {T} model
   * @param {any[]} [args]
   *
   * @method
   */
  create(model: T, ...args: any[]): Promise<T>;
  /**
   * @summary Read a model
   * @param {string} key
   * @param {any[]} [args]
   *
   * @method
   */
  read(key: string, ...args: any[]): Promise<T>;
  /**
   * @summary update a model
   * @param {T} model
   * @param {any[]} [args]
   *
   * @method
   */
  update(model: T, ...args: any[]): Promise<T>;
  /**
   * @summary delete a model
   * @param {string} key
   * @param {any[]} [args]
   *
   * @method
   */
  delete(key: string, ...args: any[]): Promise<T>;
}
