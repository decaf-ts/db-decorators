import { RepositoryFlags } from "./types";

export const DefaultRepositoryFlags: Omit<RepositoryFlags, "timestamp"> = {
  parentContext: undefined,
  childContexts: [],
  ignoredValidationProperties: [],
  callArgs: [],
  writeOperation: false,
  affectedTables: [],
  operation: undefined,
  breakOnHandlerError: true,
  rebuildWithTransient: true,
};
