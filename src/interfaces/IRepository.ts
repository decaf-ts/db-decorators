import { Model, ModelConstructor } from "@decaf-ts/decorator-validation";
import { BulkCrudOperator } from "./BulkCrudOperator";
import { RepositoryFlags } from "../repository/types";
import { Context } from "../repository";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link Model}
 * @interface IRepository
 */
export interface IRepository<
  M extends Model,
  F extends RepositoryFlags = RepositoryFlags,
  C extends Context<F> = Context<F>,
> extends BulkCrudOperator<M> {
  readonly class: ModelConstructor<M>;
  readonly pk: keyof M;
}
