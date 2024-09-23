import { DBModel } from "../model/DBModel";
import { ICRUD } from "./ICRUD";
import { DataCache } from "../repository/DataCache";
import { Constructor } from "@decaf-ts/decorator-validation";

/**
 * @summary Interface holding basic CRUD APIs
 * @typedef T extends {@link DBModel}
 * @interface IRepository
 */
export interface IRepository<T extends DBModel> extends ICRUD<T> {
  readonly cache: DataCache;
  readonly class: Constructor<T>;
}
