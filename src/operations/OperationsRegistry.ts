import { OperationHandler } from "./types";
import { DBModel } from "../model/DBModel";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
import { Operations } from "./Operations";

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
export class OperationsRegistry {
  private readonly cache: Record<
    string,
    Record<
      string | symbol,
      Record<string, Record<string, OperationHandler<any, any, any>>>
    >
  > = {};

  /**
   * @summary retrieves an {@link OperationHandler} if it exists
   * @param {string} target
   * @param {string} propKey
   * @param {string} operation
   * @param accum
   * @return {OperationHandler | undefined}
   */
  get<T extends DBModel, V extends IRepository<T>, Y>(
    target: string | Record<string, any>,
    propKey: string,
    operation: string,
    accum?: OperationHandler<T, V, Y>[],
  ): OperationHandler<T, V, Y>[] | undefined {
    accum = accum || [];
    let name;
    try {
      name = typeof target === "string" ? target : target.constructor.name;
      accum.unshift(
        ...Object.values(this.cache[name][propKey][operation] || []),
      );
    } catch (e) {
      if (
        typeof target === "string" ||
        target === Object.prototype ||
        Object.getPrototypeOf(target) === Object.prototype
      )
        return accum;
    }

    let proto = Object.getPrototypeOf(target);
    if (proto.constructor.name === name) proto = Object.getPrototypeOf(proto);

    return this.get<T, V, Y>(proto, propKey, operation, accum);
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
    const handlerName = Operations.getHandlerName(handler);

    if (!this.cache[name]) this.cache[name] = {};
    if (!this.cache[name][propKey]) this.cache[name][propKey] = {};
    if (!this.cache[name][propKey][operation])
      this.cache[name][propKey][operation] = {};
    if (this.cache[name][propKey][operation][handlerName]) return;
    this.cache[name][propKey][operation][handlerName] = handler;
  }
}
