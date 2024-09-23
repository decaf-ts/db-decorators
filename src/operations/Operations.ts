import { IRegistry, Model } from "@decaf-ts/decorator-validation";
import { OperationHandler, OperationMetadata } from "./types";
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
  private static registry: IRegistry<OperationHandler<any>>;

  private constructor() {}

  static genDecorator(
    baseOp: OperationKeys.ON | OperationKeys.AFTER,
    ops: OperationKeys[],
    handler: OperationHandler<any>,
    args: any,
    ...props: string[]
  ) {
    return (target: any, propertyKey: string) => {
      ops.forEach((op) => {
        op = baseOp + op;

        const metadata: OperationMetadata = {
          operation: op,
          handler: Operations.getHandlerName(handler),
          args: args,
          props: props,
        };

        Reflect.defineMetadata(
          Operations.genKey(op),
          metadata,
          target,
          propertyKey,
        );
        Operations.register(handler, op, target, propertyKey);
      });
    };
  }

  static getHandlerName(handler: OperationHandler<any>) {
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
