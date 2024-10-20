import { DBModel } from "../model/DBModel";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { ValidationError } from "./errors";
import { BaseRepository } from "./BaseRepository";
import { findModelId } from "../identity";
import { Constructor } from "@decaf-ts/decorator-validation";

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

  protected async createAllPrefix(models: M[], ...args: any[]): Promise<any[]> {
    await Promise.all(
      models.map(async (m) => {
        m = new this.class(m);
        await enforceDBDecorators(
          this,
          m,
          OperationKeys.CREATE,
          OperationKeys.ON,
        );
        return m;
      }),
    );
    const errors = models
      .map((m) => m.hasErrors())
      .reduce((accum: string | undefined, e, i) => {
        if (e)
          accum =
            typeof accum === "string"
              ? accum + `\n - ${i}: ${e.toString()}`
              : ` - ${i}: ${e.toString()}`;
        return accum;
      }, undefined);
    if (errors) throw new ValidationError(errors);
    return [models, ...args];
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

  protected async updateAllPrefix(models: M[], ...args: any[]) {
    const ids = models.map((m) => findModelId(m));
    const oldModels = await this.readAll(ids);
    models = models.map((m, i) => this.merge(oldModels[i], m));
    await Promise.all(
      models.map((m, i) =>
        enforceDBDecorators(
          this,
          m,
          OperationKeys.UPDATE,
          OperationKeys.ON,
          oldModels[i],
        ),
      ),
    );

    const errors = models
      .map((m, i) => m.hasErrors(oldModels[i], m))
      .reduce((accum: string | undefined, e, i) => {
        if (e)
          accum =
            typeof accum === "string"
              ? accum + `\n - ${i}: ${e.toString()}`
              : ` - ${i}: ${e.toString()}`;
        return accum;
      }, undefined);
    if (errors) throw new ValidationError(errors);
    return [models, ...args];
  }
}
