import { PrimaryKeyType } from "../repository/index";

/**
 * @description Basic CRUD operations interface
 * @summary Exposes a standard Create, Read, Update, Delete API for database operations
 * @template M - The model type
 * @interface CrudOperator
 * @memberOf module:db-decorators
 */
export interface CrudOperator<M> {
  /**
   * @description Creates a new model instance in the database
   * @summary Create a new model
   * @template M - The model type
   * @param {M} model - The model instance to create
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M>} Promise resolving to the created model instance
   */
  create(model: M, ...args: any[]): Promise<M>;
  /**
   * @description Retrieves a model instance from the database by its key
   * @summary Read a model
   * @template M - The model type
   * @param {PrimaryKeyType} key - The primary key of the model to retrieve
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M>} Promise resolving to the retrieved model instance
   */
  read(key: PrimaryKeyType, ...args: any[]): Promise<M>;
  /**
   * @description Updates a model instance in the database
   * @summary Update a model
   * @template M - The model type
   * @param {M} model - The model instance to update
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M>} Promise resolving to the updated model instance
   */
  update(model: M, ...args: any[]): Promise<M>;
  /**
   * @description Deletes a model instance from the database by its key
   * @summary Delete a model
   * @template M - The model type
   * @param {PrimaryKeyType} key - The primary key of the model to delete
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M>} Promise resolving to the deleted model instance
   */
  delete(key: PrimaryKeyType, ...args: any[]): Promise<M>;
}
