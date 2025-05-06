import { OperationHandler } from "./types";
import { OperationKeys } from "./constants";
import { IRepository } from "../interfaces/IRepository";
import { Operations } from "./Operations";
import { Model } from "@decaf-ts/decorator-validation";
import { Context, RepositoryFlags } from "../repository";

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
      Record<string, Record<string, OperationHandler<any, any, any, any, any>>>
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
  get<
    M extends Model,
    R extends IRepository<M, F, C>,
    V extends object,
    F extends RepositoryFlags,
    C extends Context<F>,
  >(
    target: string | Record<string, any>,
    propKey: string,
    operation: string,
    accum?: OperationHandler<M, R, V, F, C>[]
  ): OperationHandler<M, R, V, F, C>[] | undefined {
    accum = accum || [];
    let name;
    try {
      name = typeof target === "string" ? target : target.constructor.name;
      accum.unshift(
        ...Object.values(this.cache[name][propKey][operation] || [])
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      if (
        typeof target === "string" ||
        target === Object.prototype ||
        Object.getPrototypeOf(target) === Object.prototype
      )
        return accum;
    }

    let proto = Object.getPrototypeOf(target);
    if (proto.constructor.name === name) proto = Object.getPrototypeOf(proto);

    return this.get<M, R, V, F, C>(proto, propKey, operation, accum);
  }

  /**
   * @summary Registers an {@link OperationHandler}
   * @param {OperationHandler} handler
   * @param {string} operation
   * @param {{}} target
   * @param {string | symbol} propKey
   */
  register<
    M extends Model,
    R extends IRepository<M, F, C>,
    V extends object,
    F extends RepositoryFlags,
    C extends Context<F>,
  >(
    handler: OperationHandler<M, R, V, F, C>,
    operation: OperationKeys,
    target: M,
    propKey: string | symbol
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
