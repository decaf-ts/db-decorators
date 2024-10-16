import { DBModel } from "../model/DBModel";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { ValidationError } from "./errors";
import { BaseRepository } from "./BaseRepository";
import { findModelId } from "../identity";
import { Constructor, Model } from "@decaf-ts/decorator-validation";

export abstract class Repository<M extends DBModel> extends BaseRepository<M> {
  protected constructor(clazz?: Constructor<M>) {
    super(clazz);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: M): Promise<M> {
    throw new Error("Child classes must implement this.");
  }

  protected override async createPrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...any[]]> {
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON,
    );

    const errors = model.hasErrors();
    if (errors) throw new ValidationError(errors.toString());

    return [model, ...args];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(key: string | number): Promise<M> {
    throw new Error("Child classes must implement this.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async read(key: string | number): Promise<M> {
    throw new Error("Child classes must implement this.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: M): Promise<M> {
    throw new Error("Child classes must implement this.");
  }

  protected async updatePrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...args: any[]]> {
    model = new this.class(model);
    const pk = findModelId(model);

    const oldModel = await this.read(pk);

    model = this.merge(oldModel, model);

    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
      oldModel,
    );

    const errors = model.hasErrors(oldModel);
    if (errors) throw new ValidationError(errors.toString());
    return [model, ...args];
  }

  protected merge(oldModel: M, model: M): M {
    const extract = (model: M) =>
      Object.entries(model).reduce((accum: Record<string, any>, [key, val]) => {
        if (typeof val !== "undefined") accum[key] = val;
        return accum;
      }, {});

    return new this.class(Object.assign({}, extract(oldModel), extract(model)));
  }
}
