import {DBModel} from "../../src/model/DBModel";
import {Repository} from "../../src/repository/Repository";
import {findModelId} from "../../src/identity/utils";
import {enforceDBDecorators} from "../../src/repository/utils";
import {OperationKeys} from "../../src/operations/constants";
import {ConflictError, NotFoundError, ValidationError} from "../../src/repository/errors";
import {sf} from "@decaf-ts/decorator-validation";

export class RamRepository<T extends DBModel> extends Repository<T> {
  protected ram: Record<string, T> = {};

  constructor() {
    super()
  }

  async create(model: T): Promise<T> {
    const pk = findModelId(model);
    this.ram[pk] = model;
    return model;
  }

  protected override async createPrefix(model: T, ...args: any[]): Promise<[T, ...any[]]> {
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON,
    );

    const errors = model.hasErrors();
    if (errors) throw new ValidationError(errors.toString());

    let id: string | number | undefined;
    try {
      id = findModelId(model, true);
      if (!id) return [model, ...args];
      if (id) await this.read(id.toString());
    } catch (e: any) {
      if (e instanceof NotFoundError) return [model, ...args];
    }

    throw new ConflictError(sf("Model with id {0} already exists", id as string));
  }

  async delete(key: string | number): Promise<T> {
    const self = this;
    const toDelete = self.ram[key];
    delete self.ram[key];
    return toDelete
  }

  protected override async deletePrefix(key: string | number, ...args: any[]): Promise<[string | number, ...any[]]> {
    let model = new this.class();
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.DELETE,
      OperationKeys.ON,
    );

    await this.read(key);
    return [key, ...args];
  }

  async read(key: string | number): Promise<T> {
    if (!(key in this.ram))
      throw new NotFoundError(`${key} not found`)
    return this.ram[key];
  }

  async update(model: T): Promise<T> {
    const pk = findModelId(model);
    this.ram[pk] = model;
    return model;
  }

  protected async updatePrefix(model: T, ...args: any[]): Promise<[T, ...args: any[]]> {
    model = new this.class(model);
    await enforceDBDecorators(
      this,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
    );

    const pk = findModelId(model);

    const oldModel = await this.read(pk);
    const errors = model.hasErrors(oldModel);
    if (errors) throw new ValidationError(errors.toString());
    return [model, ...args];
  }
}