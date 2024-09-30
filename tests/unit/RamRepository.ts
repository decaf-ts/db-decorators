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

  async delete(key: string | number): Promise<T> {
    const self = this;
    const toDelete = self.ram[key];
    delete self.ram[key];
    return toDelete
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
}