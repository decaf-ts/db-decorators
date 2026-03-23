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
 * @description Database operation key naming constants
 * @summary Enum defining operations naming
 * @enum {string}
 * @readonly
 * @memberOf module:db-decorators
 */
export enum ModelOperations {
  OPERATIONS = "operations",
  RELATIONS = "relations",
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

export enum BulkOperationBlockTarget {
  ALL = "bulkAll",
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

/**
 * @description Block target categories
 * @summary Indicates whether the block applies to CRUD ops, prepared statements, or query keys
 * @typedef {"crud" | "statement" | "query"} BlockOperationKind
 * @memberOf module:db-decorators
 */
export type BlockOperationKind = "crud" | "statement" | "query" | "bulk";

/**
 * @description Descriptor for a single blocked operation target
 * @summary Includes the target kind and identifier (CRUD operation, statement name, query key)
 * @typedef BlockOperationDescriptor
 * @property {"crud"} kind
 * @property {CrudOperations} value
 *
 * @property {"statement"} kind
 * @property {string} value
 *
 * @property {"query"} kind
 * @property {string} value
 * @memberOf module:db-decorators
 */
export type BlockOperationDescriptor =
  | { kind: "crud"; value: CrudOperations }
  | { kind: "statement"; value: string }
  | { kind: "query"; value: string }
  | { kind: "bulk"; value: BulkCrudOperations | BulkOperationBlockTarget };

/**
 * @description Inputs accepted by @BlockOperations decorator
 * @summary Accepts either a CRUD operation, a descriptor, or an array of both
 * @typedef {CrudOperations | BlockOperationDescriptor | Array<CrudOperations | BlockOperationDescriptor>} BlockOperationsInput
 * @memberOf module:db-decorators
 */
export type BlockOperationsInput =
  | CrudOperations
  | BulkCrudOperations
  | BulkOperationBlockTarget
  | BlockOperationDescriptor
  | (CrudOperations | BulkCrudOperations | BulkOperationBlockTarget | BlockOperationDescriptor)[];
