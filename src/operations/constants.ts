/**
 * @description Database operation key constants
 * @summary Enum defining CRUD operations and their lifecycle phases
 * @enum {string}
 * @readonly
 * @memberOf module:db-decorators
 */
export enum OperationKeys {
  REFLECT = "decaf.model.db.operations.",
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  ON = "on.",
  AFTER = "after.",
  BLOCK = "block",
}

/**
 * @description Type for basic CRUD operations
 * @summary Union type of the four basic database operations: create, read, update, delete
 * @typedef {string} CrudOperations
 * @memberOf module:db-decorators
 */
export type CrudOperations =
  | OperationKeys.CREATE
  | OperationKeys.READ
  | OperationKeys.UPDATE
  | OperationKeys.DELETE;

/**
 * @description Bulk database operation key constants
 * @summary Enum defining bulk CRUD operations for handling multiple records at once
 * @enum {string}
 * @readonly
 * @memberOf module:db-decorators
 */
export enum BulkCrudOperationKeys {
  CREATE_ALL = "createAll",
  READ_ALL = "readAll",
  UPDATE_ALL = "updateAll",
  DELETE_ALL = "deleteAll",
}

/**
 * @description Type for bulk CRUD operations
 * @summary Union type of the four bulk database operations for handling multiple records at once
 * @typedef {string} BulkCrudOperations
 * @memberOf module:db-decorators
 */
export type BulkCrudOperations =
  | BulkCrudOperationKeys.CREATE_ALL
  | BulkCrudOperationKeys.READ_ALL
  | BulkCrudOperationKeys.UPDATE_ALL
  | BulkCrudOperationKeys.DELETE_ALL;

/**
 * @description Grouped CRUD operations for decorator mapping
 * @summary Maps out groups of CRUD operations for easier mapping of decorators
 * @const DBOperations
 * @memberOf module:db-decorators
 */
export const DBOperations: Record<string, CrudOperations[]> = {
  CREATE: [OperationKeys.CREATE],
  READ: [OperationKeys.READ],
  UPDATE: [OperationKeys.UPDATE],
  DELETE: [OperationKeys.DELETE],
  CREATE_UPDATE: [OperationKeys.CREATE, OperationKeys.UPDATE],
  READ_CREATE: [OperationKeys.READ, OperationKeys.CREATE],
  ALL: [
    OperationKeys.CREATE,
    OperationKeys.READ,
    OperationKeys.UPDATE,
    OperationKeys.DELETE,
  ],
};
