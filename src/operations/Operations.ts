import { IRegistry } from "@decaf-ts/decorator-validation";
import { OperationHandler } from "./types";
import { OperationsRegistry } from "./OperationsRegistry";
import { DBModel } from "../model/DBModel";
import { OperationKeys } from "./constants";

export class Operations {
  private static registry: IRegistry<OperationHandler<any>>;

  private constructor() {}

  static get(targetName: string, propKey: string, operation: string) {
    return Operations.registry.get(targetName, propKey, operation);
  }

  private static getOpRegistry() {
    if (!Operations.registry) Operations.registry = new OperationsRegistry();
    return Operations.registry;
  }

  static setOpRegistry(registry: IRegistry<OperationHandler<any>>) {
    Operations.registry = registry;
  }

  static register<V extends DBModel>(
    handler: OperationHandler<V>,
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
