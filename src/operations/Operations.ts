import { Hashing } from "@decaf-ts/decorator-validation";
import { OperationHandler } from "./types";
import { OperationsRegistry } from "./OperationsRegistry";
import { DBModel } from "../model/DBModel";
import { OperationKeys } from "./constants";

/**
 * @summary Static class holding common Operation Functionality
 *
 * @class Operations
 *
 * @category Operations
 */
export class Operations {
  private static registry: OperationsRegistry;

  private constructor() {}

  static getHandlerName(handler: OperationHandler<any, any, any>) {
    if (handler.name) return handler.name;

    console.warn(
      "Handler name not defined. A name will be generated, but this is not desirable. please avoid using anonymous functions",
    );
    return Hashing.hash(handler.toString());
  }

  static genKey(str: string) {
    return OperationKeys.REFLECT + str;
  }

  static get(
    targetName: string | Record<string, any>,
    propKey: string,
    operation: string,
  ) {
    return Operations.registry.get(targetName, propKey, operation);
  }

  private static getOpRegistry() {
    if (!Operations.registry) Operations.registry = new OperationsRegistry();
    return Operations.registry;
  }

  static register<V extends DBModel>(
    handler: OperationHandler<V, any, any>,
    operation: OperationKeys,
    target: V,
    propKey: string | symbol,
  ) {
    Operations.getOpRegistry().register(
      handler as any,
      operation,
      target,
      propKey,
    );
  }
}
