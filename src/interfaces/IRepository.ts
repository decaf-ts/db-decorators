import { Model, ModelConstructor } from "@decaf-ts/decorator-validation";
import { BulkCrudOperator } from "./BulkCrudOperator";
import { RepositoryFlags } from "../repository/types";
import { Context } from "../repository";

/**
 * @description Repository interface for database operations
 * @summary Interface holding basic CRUD APIs for database models, providing standard operations and metadata
 * @template M - Type extending Model
 * @template F - Type extending RepositoryFlags, defaults to RepositoryFlags
 * @template C - Type extending Context<F>, defaults to Context<F>
 * @interface IRepository
 * @memberOf module:db-decorators
 */
export interface IRepository<
  M extends Model,
  F extends RepositoryFlags = RepositoryFlags,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  C extends Context<F> = Context<F>,
> extends BulkCrudOperator<M> {
  /**
   * @description The constructor of the model class
   * @summary Reference to the model class constructor used to create new instances
   */
  readonly class: ModelConstructor<M>;

  readonly pk: keyof M;
}
