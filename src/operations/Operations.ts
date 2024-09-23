import { IRegistry, Model } from "@decaf-ts/decorator-validation";
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
  private static registry: IRegistry<OperationHandler<any, any>>;

  private constructor() {}

  static getHandlerName(handler: OperationHandler<any, any>) {
    if (handler.name) return handler.name;

    console.warn(
      "Handler name not defined. A name will be generated, but this is not desirable",
    );
    return Model.hash(handler.toString());
  }

  static genKey(str: string) {
    return OperationKeys.REFLECT + str;
  }

  static get(targetName: string, propKey: string, operation: string) {
    return Operations.registry.get(targetName, propKey, operation);
  }

  private static getOpRegistry() {
    if (!Operations.registry) Operations.registry = new OperationsRegistry();
    return Operations.registry;
  }

  static setOpRegistry(registry: IRegistry<OperationHandler<any, any>>) {
    Operations.registry = registry;
  }

  static register<V extends DBModel>(
    handler: OperationHandler<V, any>,
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
