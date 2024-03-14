/**
 * Set of constants to define db CRUD operations and their equivalent 'on' and 'after' phases
 * @enum OperationKeys
 *
 * @category Constants
 */
export enum OperationKeys {
  REFLECT = "operations.db.",
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  ON = "on.",
  AFTER = "after.",
}

/**
 * Maps out groups of CRUD operations for easier mapping of decorators
 *
 * @constant DBOperations
 *
 * @memberOf db-decorators.operations
 */
export enum DBOperations {
  CREATE = [OperationKeys.CREATE],
  READ = [OperationKeys.READ],
  UPDATE = [OperationKeys.UPDATE],
  DELETE = [OperationKeys.DELETE],
  CREATE_UPDATE = [OperationKeys.CREATE, OperationKeys.UPDATE],
  READ_CREATE = [OperationKeys.READ, OperationKeys.CREATE],
  ALL = [
    OperationKeys.CREATE,
    OperationKeys.READ,
    OperationKeys.UPDATE,
    OperationKeys.DELETE,
  ],
}

/**
 * @enum DBErrors
 *
 * @memberOf db-decorators.operations
 */
export const DBErrors = {
  EXISTS: "Already Exists",
  MISSING: "Missing or Deleted",
};
