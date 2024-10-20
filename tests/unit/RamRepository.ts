import { Repository } from "../../src/repository/Repository";
import { findModelId } from "../../src/identity/utils";
import { NotFoundError } from "../../src/repository/errors";
import { Constructor } from "@decaf-ts/decorator-validation";

export class RamRepository<T extends Model> extends Repository<T> {
  protected ram: Record<string, T> = {};

  constructor(clazz?: Constructor<T>) {
    super(clazz);
  }

  async create(model: T): Promise<T> {
    const pk = findModelId(model);
    this.ram[pk] = model;
    return model;
  }

  async delete(key: string | number): Promise<T> {
    const toDelete = this.ram[key];
    delete this.ram[key];
    return toDelete;
  }

  async read(key: string | number): Promise<T> {
    if (!(key in this.ram)) throw new NotFoundError(`${key} not found`);
    return this.ram[key];
  }

  async update(model: T): Promise<T> {
    const pk = findModelId(model);
    this.ram[pk] = model;
    return model;
  }
}
