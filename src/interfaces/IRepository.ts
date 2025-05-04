import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { BulkCrudOperator } from "./BulkCrudOperator";
import { Context, RepositoryFlags } from "../repository";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link Model}
 * @interface IRepository
 */
export interface IRepository<
  M extends Model,
  C extends Context<F>,
  F extends RepositoryFlags = RepositoryFlags,
> extends BulkCrudOperator<M> {
  readonly class: Constructor<M>;
  readonly pk: string;
}
