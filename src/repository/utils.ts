import { IRepository } from "../interfaces/IRepository";
import {
  BulkCrudOperationKeys,
  ModelOperations,
  OperationKeys,
} from "../operations/constants";
import { InternalError } from "./errors";
import { Model, ModelErrorDefinition } from "@decaf-ts/decorator-validation";
import { Context } from "./Context";
import {
  getHandlersDecorators,
  groupDecorators,
  sortDecorators,
} from "../operations/decorators";
import { UpdateOperationHandler } from "../operations/types";
import { Constructor, Metadata } from "@decaf-ts/decoration";
import { ContextOfRepository } from "./types";

export type ContextArgs<C extends Context<any>> = {
  context: C;
  args: [...any[], C];
};

export function reduceErrorsToPrint(
  errors: (ModelErrorDefinition | undefined)[]
): string | undefined {
  return errors.reduce((accum: string | undefined, e, i) => {
    if (e)
      accum =
        typeof accum === "string"
          ? accum + `\n - ${i}: ${e.toString()}`
          : ` - ${i}: ${e.toString()}`;
    return accum;
  }, undefined);
}

/**
 *
 * @param {IRepository<T>} repo
 * @param context
 * @param {T} model
 * @param operation
 * @param prefix
 *
 * @param oldModel
 * @function enforceDBPropertyDecoratorsAsync
 *
 * @memberOf db-decorators.utils
 */
export async function enforceDBDecorators<
  M extends Model<true | false>,
  R extends IRepository<M, any>,
  V extends object = object,
>(
  repo: R,
  context: ContextOfRepository<R>,
  model: M,
  operation: string,
  prefix: string,
  oldModel?: M
): Promise<void> {
  const decorators: Record<string, DecoratorMetadata[]> | undefined =
    getDbDecorators(model, operation, prefix);

  if (!decorators) return;

  const hanlersDecorators = getHandlersDecorators(model, decorators, prefix);
  const groupedDecorators = groupDecorators(hanlersDecorators);
  const sortedDecorators = sortDecorators(groupedDecorators);

  for (const dec of sortedDecorators) {
    const args: any[] = [
      context,
      dec.data.length > 1 ? dec.data : dec.data[0],
      dec.prop.length > 1 ? dec.prop : dec.prop[0],
      model,
    ];

    if (
      [OperationKeys.UPDATE, BulkCrudOperationKeys.UPDATE_ALL].includes(
        operation as any
      )
    ) {
      if (!oldModel)
        throw new InternalError("Missing old model for update operation");
      args.push(oldModel);
    }
    try {
      await (dec.handler as UpdateOperationHandler<M, R, V>).apply(
        repo,
        args as [ContextOfRepository<R>, V, keyof M, M, M]
      );
    } catch (e: unknown) {
      context.logger
        .for(enforceDBDecorators)
        .error(
          `Failed to execute handler ${dec.handler.name} for ${dec.prop} on ${model.constructor.name}`
        );
      if (context.get("breakOnHandlerError")) throw e;
    }
  }
}

/**
 * Specific for DB Decorators
 * @param {T} model
 * @param {string} operation CRUD {@link OperationKeys}
 * @param {string} [extraPrefix]
 *
 * @function getDbPropertyDecorators
 *
 * @memberOf db-decorators.utils
 */
export function getDbDecorators<T extends Model>(
  model: T,
  operation: string,
  extraPrefix?: string
): Record<string, DecoratorMetadata[]> | undefined {
  const prefix = extraPrefix?.replace(/[.]$/, "");

  const decorators = Metadata.get(
    model.constructor as Constructor<T>,
    ModelOperations.OPERATIONS
  );

  if (!decorators) return;
  return Object.keys(decorators).reduce(
    (accum: Record<string, DecoratorMetadata[]> | undefined, decorator) => {
      const obj = prefix
        ? decorators[decorator][prefix] || {}
        : decorators[decorator];
      const dec = Object.keys(obj).filter((d: any) => d === operation);
      const decs = [];
      for (const d of dec) decs.push({ key: d, props: obj[d] });

      if (decs && decs.length) {
        if (!accum) accum = {};
        accum[decorator] = decs;
      }
      return accum;
    },
    undefined
  );
}
