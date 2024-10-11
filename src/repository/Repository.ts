import { DBModel } from "../model/DBModel";
import { enforceDBDecorators } from "./utils";
import { OperationKeys } from "../operations/constants";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
import { BaseRepository } from "./BaseRepository";
import { findModelId } from "../identity";
import { Constructor, sf } from "@decaf-ts/decorator-validation";

export abstract class Repository<T extends DBModel> extends BaseRepository<T> {
  protected constructor(clazz?: Constructor<T>) {
    super(clazz);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(model: T): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  protected override async createPrefix(
    model: T,
    ...args: any[]
  ): Promise<[T, ...any[]]> {
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
    //
    // let id: string | number | undefined;
    // try {
    //   id = findModelId(model, true);
    //   if (!id) return [model, ...args];
    //   if (id) await this.read(id.toString());
    // } catch (e: any) {
    //   if (e instanceof NotFoundError) return [model, ...args];
    //   throw e;
    // }
    //
    // throw new ConflictError(
    //   sf("Model with id {0} already exists", id as string),
    // );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(key: string | number): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  protected override async deletePrefix(
    key: string | number,
    ...args: any[]
  ): Promise<[string | number, ...any[]]> {
    const model = new this.class();
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.DELETE,
      OperationKeys.ON,
    );

    return [key, ...args];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async read(key: string | number): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(model: T): Promise<T> {
    throw new Error("Child classes must implement this.");
  }

  protected async updatePrefix(
    model: T,
    ...args: any[]
  ): Promise<[T, ...args: any[]]> {
    model = new this.class(model);
    const pk = findModelId(model);

    const oldModel = await this.read(pk);

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
}
