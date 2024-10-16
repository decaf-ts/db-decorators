import { DBModel } from "../model/DBModel";
import { DataCache } from "../repository/DataCache";
import { Constructor } from "@decaf-ts/decorator-validation";
import { BulkCrudOperator } from "./BulkCrudOperator";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link DBModel}
 * @interface IRepository
 */
export interface IRepository<M extends DBModel> extends BulkCrudOperator<M> {
  readonly cache: DataCache;
  readonly class: Constructor<M>;
}
