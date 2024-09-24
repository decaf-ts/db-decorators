import { DBModel } from "../model/DBModel";
import { DataCache } from "../repository/DataCache";
import { Constructor } from "@decaf-ts/decorator-validation";
import { CrudOperator } from "./CrudOperator";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link DBModel}
 * @interface IRepository
 */
export interface IRepository<T extends DBModel> extends CrudOperator<T> {
  readonly cache: DataCache;
  readonly class: Constructor<T>;
}
