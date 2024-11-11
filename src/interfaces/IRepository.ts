import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { BulkCrudOperator } from "./BulkCrudOperator";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link Model}
 * @interface IRepository
 */
export interface IRepository<M extends Model> extends BulkCrudOperator<M> {
  readonly class: Constructor<M>;
  readonly pk: string;
}
