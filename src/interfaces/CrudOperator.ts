/**
 * @summary Crud API
 * @description Exposes a CRUD API
 *
 * @interface CrudOperator
 *
 * @category Managers
 */
export interface CrudOperator<M> {
  /**
   * @summary Create a new model
   * @param {T} model
   * @param {any[]} [args]
   *
   * @method
   */
  create(model: M, ...args: any[]): Promise<M>;
  /**
   * @summary Read a model
   * @param {string} key
   * @param {any[]} [args]
   *
   * @method
   */
  read(key: string | number, ...args: any[]): Promise<M>;
  /**
   * @summary update a model
   * @param {T} model
   * @param {any[]} [args]
   *
   * @method
   */
  update(model: M, ...args: any[]): Promise<M>;
  /**
   * @summary delete a model
   * @param {string} key
   * @param {any[]} [args]
   *
   * @method
   */
  delete(key: string | number, ...args: any[]): Promise<M>;
}
