import "../../src/overrides";
import { Repository } from "../../src/repository/Repository";
import { NotFoundError } from "../../src/repository/errors";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "../../src/repository/Context";
import { RepositoryFlags } from "../../src";
import { Constructor } from "@decaf-ts/decoration";

export class RamRepository<M extends Model> extends Repository<
  M,
  RepositoryFlags,
  Context<RepositoryFlags>
> {
  protected ram: Record<string, M> = {};

  constructor(clazz?: Constructor<M>) {
    super(clazz);
  }

  async create(model: M): Promise<M> {
    // const pk = findModelId(model, true);
    // TODO: Fix Model.pk method
    const pk = Model.pk(model, true); // Throws error decorator_validation_1.Model.pk is not a function
    this.ram[pk as string] = model;
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
    // const pk = findModelId(model, true);
    // TODO: Fix Model.pk method
    const pk = Model.pk(model, true); // Throws error decorator_validation_1.Model.pk is not a function
    this.ram[pk as string] = model;
    return model;
  }
}
