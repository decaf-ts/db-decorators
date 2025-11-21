import { CrudOperator } from "./CrudOperator";
import { PrimaryKeyType } from "../repository/index";

/**
 * @description Interface for bulk CRUD operations
 * @summary Extends the basic CRUD operations to support bulk operations on multiple models at once
 * @template M - The model type
 * @interface BulkCrudOperator
 * @memberOf module:db-decorators
 */
export interface BulkCrudOperator<M> extends CrudOperator<M> {
  /**
   * @description Creates multiple model instances in the database
   * @summary Bulk operation to create multiple models at once
   * @template M - The model type
   * @param {M[]} models - Array of model instances to create
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M[]>} Promise resolving to the created model instances
   */
  createAll(models: M[], ...args: any[]): Promise<M[]>;

  /**
   * @description Retrieves multiple model instances from the database by their keys
   * @summary Bulk operation to read multiple models at once
   * @template M - The model type
   * @param {(PrimaryKeyType[])} keys - Array of primary keys to retrieve
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M[]>} Promise resolving to the retrieved model instances
   */
  readAll(keys: PrimaryKeyType[], ...args: any[]): Promise<M[]>;

  /**
   * @description Updates multiple model instances in the database
   * @summary Bulk operation to update multiple models at once
   * @template M - The model type
   * @param {M[]} models - Array of model instances to update
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M[]>} Promise resolving to the updated model instances
   */
  updateAll(models: M[], ...args: any[]): Promise<M[]>;

  /**
   * @description Deletes multiple model instances from the database by their keys
   * @summary Bulk operation to delete multiple models at once
   * @template M - The model type
   * @param {(PrimaryKeyType[])} keys - Array of primary keys to delete
   * @param {...any[]} args - Additional arguments
   * @return {Promise<M[]>} Promise resolving to the deleted model instances
   */
  deleteAll(keys: PrimaryKeyType[], ...args: any[]): Promise<M[]>;
}
