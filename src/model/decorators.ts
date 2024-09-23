import { DBKeys } from "./constants";
import { OrderDirection } from "../validation/constants";
import { metadata } from "@decaf-ts/reflection";
import { IndexMetadata } from "../repository/types";

/**
 *
 * @param {str} str
 * @memberOf db-decorators.model
 */

export function getDBKey(str: string) {
  return DBKeys.REFLECT + str;
}

/**
 * @summary Index Decorator
 * @description properties decorated will the index in the
 * DB for performance in queries
 *
 * @param {OrderDirection[]} [directions]
 * @param {string[]} [compositions]
 *
 * @function index
 */
export function index(compositions?: string[], directions?: OrderDirection[]) {
  return metadata(
    getDBKey(
      `${DBKeys.INDEX}${compositions && compositions.length ? `.${compositions.join(".")}` : ""}`,
    ),
    {
      directions: directions,
      compositions: compositions,
    } as IndexMetadata,
  );
}
