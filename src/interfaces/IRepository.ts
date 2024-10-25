import { Constructor, Model } from "@decaf-ts/decorator-validation";
import { BulkCrudOperator } from "./BulkCrudOperator";
import { Contextual } from "./Contextual";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link Model}
 * @interface IRepository
 */
export interface IRepository<M extends Model>
  extends BulkCrudOperator<M>,
    Contextual {
  readonly class: Constructor<M>;
  timestamp(): Promise<Date>;
}
