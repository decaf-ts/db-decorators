/**
 * @summary Set of constants to define db CRUD operations and their equivalent 'on' and 'after' phases
 * @const OperationKeys
 *
 * @memberOf module:db-decorators.Operations
 */
export enum OperationKeys {
  REFLECT = "decaf.model.db.operations.",
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  ON = "on.",
  AFTER = "after.",
}

export type CrudOperations =
  | OperationKeys.CREATE
  | OperationKeys.READ
  | OperationKeys.UPDATE
  | OperationKeys.DELETE;

/**
 * @summary Maps out groups of CRUD operations for easier mapping of decorators
 *
 * @constant DBOperations
 *
 * @memberOf module:db-decorators.Operations
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
