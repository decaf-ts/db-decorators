import { Repository } from "../../src/repository/Repository";
import { findModelId } from "../../src/identity/utils";
import { NotFoundError } from "../../src/repository/errors";
import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { Context } from "../../src/repository/Context";
import { RepositoryFlags } from "../../src";

export class RamRepository<M extends Model> extends Repository<
  M,
  Context<RepositoryFlags>,
  RepositoryFlags
> {
  protected ram: Record<string, M> = {};

  constructor(clazz?: Constructor<M>) {
    super(clazz);
  }

  async create(model: M): Promise<M> {
    const pk = findModelId(model);
    this.ram[pk] = model;
    return model;
  }

  async delete(key: string | number): Promise<M> {
    const toDelete = this.ram[key];
    delete this.ram[key];
    return toDelete;
  }

  async read(key: string | number): Promise<M> {
    if (!(key in this.ram)) throw new NotFoundError(`${key} not found`);
    return this.ram[key];
  }

  async update(model: M): Promise<M> {
    const pk = findModelId(model);
    this.ram[pk] = model;
    return model;
  }
}
