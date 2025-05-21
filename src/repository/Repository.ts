import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError, ValidationError } from "./errors";
import { BaseRepository } from "./BaseRepository";
import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { DBKeys } from "../model/constants";
import { Context } from "./Context";
import { RepositoryFlags } from "./types";

export abstract class Repository<
  M extends Model,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> extends BaseRepository<M, F, C> {
  protected constructor(clazz?: Constructor<M>) {
    super(clazz);
  }

  protected override async createPrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...any[]]> {
    const contextArgs = await Context.args(
      OperationKeys.CREATE,
      this.class,
      args
    );
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      contextArgs.context,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON
    );

    const errors = model.hasErrors();
    if (errors) throw new ValidationError(errors.toString());

    return [model, ...contextArgs.args];
  }

  protected async createAllPrefix(models: M[], ...args: any[]): Promise<any[]> {
    const contextArgs = await Context.args(
      OperationKeys.CREATE,
      this.class,
      args
    );
    await Promise.all(
      models.map(async (m) => {
        m = new this.class(m);
        await enforceDBDecorators(
          this,
          contextArgs.context,
          m,
          OperationKeys.CREATE,
          OperationKeys.ON
        );
        return m;
      })
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
    return [models, ...contextArgs.args];
  }

  protected async updatePrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...args: any[]]> {
    const contextArgs = await Context.args(
      OperationKeys.UPDATE,
      this.class,
      args
    );
    const pk = (model as any)[this.pk];
    if (!pk)
      throw new InternalError(
        `No value for the Id is defined under the property ${this.pk as string}`
      );

    const oldModel: M = await this.read(pk);

    model = this.merge(oldModel, model);

    await enforceDBDecorators(
      this,
      contextArgs.context,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
      oldModel
    );

    const errors = model.hasErrors(oldModel as any);
    if (errors) throw new ValidationError(errors.toString());
    return [model, ...contextArgs.args];
  }

  protected async updateAllPrefix(models: M[], ...args: any[]) {
    const contextArgs = await Context.args(
      OperationKeys.UPDATE,
      this.class,
      args
    );
    const ids = models.map((m) => {
      const id = m[this.pk];
      if (typeof id === "undefined")
        throw new InternalError(
          `No value for the Id is defined under the property ${this.pk as string}`
        );
      return id as string;
    });
    const oldModels: M[] = await this.readAll(ids, ...contextArgs.args);
    models = models.map((m, i) => this.merge(oldModels[i], m));
    await Promise.all(
      models.map((m, i) =>
        enforceDBDecorators(
          this,
          contextArgs.context,
          m,
          OperationKeys.UPDATE,
          OperationKeys.ON,
          oldModels[i]
        )
      )
    );

    const errors = models
      .map((m, i) => m.hasErrors(oldModels[i] as any))
      .reduce((accum: string | undefined, e, i) => {
        if (e)
          accum =
            typeof accum === "string"
              ? accum + `\n - ${i}: ${e.toString()}`
              : ` - ${i}: ${e.toString()}`;
        return accum;
      }, undefined);
    if (errors) throw new ValidationError(errors);
    return [models, ...contextArgs.args];
  }

  static key(key: string) {
    return DBKeys.REFLECT + key;
  }
}
