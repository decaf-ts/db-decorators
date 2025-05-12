import { RepositoryFlags } from "./types";

export const DefaultRepositoryFlags: Omit<RepositoryFlags, "timestamp"> = {
  parentContext: undefined,
  childContexts: [],
  callArgs: [],
  writeOperation: false,
  affectedTables: [],
  operation: undefined,
  breakOnHandlerError: true,
};
