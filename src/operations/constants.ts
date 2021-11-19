
export const OperationKeys = {
    REFLECT: 'operations.db.',
    CREATE: 'create',
    READ: "read",
    UPDATE: 'update',
    DELETE: 'delete'
}

export const DBOperations = {
    CREATE: [OperationKeys.CREATE],
    READ: [OperationKeys.READ],
    UPDATE: [OperationKeys.UPDATE],
    DELETE: [OperationKeys.DELETE],
    CREATE_UPDATE: [OperationKeys.CREATE, OperationKeys.UPDATE],
    ALL: [OperationKeys.CREATE, OperationKeys.READ, OperationKeys.UPDATE, OperationKeys.DELETE]
}

export const DBErrors = {
    EXISTS: "Already Exists",
    MISSING: "Missing or Deleted"
}