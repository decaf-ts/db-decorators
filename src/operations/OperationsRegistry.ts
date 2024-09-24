import { IRegistry } from "@decaf-ts/decorator-validation";
import { OperationHandler } from "./types";
import { DBModel } from "../model/DBModel";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";

/**
 * @summary Holds the registered operation handlers
 *
 * @class OperationsRegistry
 * @implements IRegistry<OperationHandler<any>>
 *
 * @see OperationHandler
 *
 * @category Operations
 */
export class OperationsRegistry
  implements IRegistry<OperationHandler<any, any, any>>
{
  private readonly cache: Record<
    string,
    Record<string, Record<string, OperationHandler<any, any, any>>>
  > = {};

  /**
   * @summary retrieves an {@link OperationHandler} if it exists
   * @param {string} targetName
   * @param {string} propKey
   * @param {string} operation
   * @return {OperationHandler | undefined}
   */
  get<T extends DBModel, V extends IRepository<T>, Y>(
    targetName: string,
    propKey: string,
    operation: string,
  ): OperationHandler<T, V, Y> | undefined {
    try {
      return this.cache[targetName][propKey][operation];
    } catch (e) {
      return undefined;
    }
  }

  /**
   * @summary Registers an {@link OperationHandler}
   * @param {OperationHandler} handler
   * @param {string} operation
   * @param {{}} target
   * @param {string | symbol} propKey
   */
  register<T extends DBModel, V extends IRepository<T>, Y>(
    handler: OperationHandler<T, V, Y>,
    operation: OperationKeys,
    target: T,
    propKey: string | symbol,
  ): void {
    const name = target.constructor.name;
    if (!this.cache[name]) this.cache[name] = {};
    if (!this.cache[name][propKey as string])
      this.cache[name][propKey as string] = {};
    if (this.cache[name][propKey as string][operation]) return;
    this.cache[name][propKey as string][operation] = handler;
  }
}
