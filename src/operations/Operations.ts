import { Hashing, Model } from "@decaf-ts/decorator-validation";
import { OperationHandler } from "./types";
import { OperationsRegistry } from "./OperationsRegistry";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces";
import { Context } from "../repository";
import { RepositoryFlags } from "../repository/types";

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

  static getHandlerName(handler: OperationHandler<any, any, any, any, any>) {
    if (handler.name) return handler.name;

    console.warn(
      "Handler name not defined. A name will be generated, but this is not desirable. please avoid using anonymous functions"
    );
    return Hashing.hash(handler.toString());
  }

  static key(str: string) {
    return OperationKeys.REFLECT + str;
  }

  static get<
    M extends Model,
    R extends IRepository<M, F, C>,
    V = object,
    F extends RepositoryFlags = RepositoryFlags,
    C extends Context<F> = Context<F>,
  >(
    targetName: string | Record<string, any>,
    propKey: string,
    operation: string
  ) {
    return Operations.registry.get<M, R, V, F, C>(
      targetName,
      propKey,
      operation
    );
  }

  private static getOpRegistry() {
    if (!Operations.registry) Operations.registry = new OperationsRegistry();
    return Operations.registry;
  }

  static register<V extends Model>(
    handler: OperationHandler<V, any, any>,
    operation: OperationKeys,
    target: V,
    propKey: string | symbol
  ) {
    Operations.getOpRegistry().register(
      handler as any,
      operation,
      target,
      propKey
    );
  }
}
