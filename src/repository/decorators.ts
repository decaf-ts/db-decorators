import { injectable } from "@decaf-ts/injectable-decorators";
/**
 * @summary Defines a class as a repository (makes it injectable)
 * and forces an instantiation over any other possible with that key
 *
 * @param {string} [category] category name to be passed to injectables {@link injectable}
 * @param {any[]} [props] optional props to be passed to {@link injectable}
 *
 * @see injectable
 * with args:
 *  - singleton: true;
 *  - force: true;
 *  - args: {@param props}
 *
 * @function repository
 *
 * @memberOf module:db-decorators.Decorators.model
 */

export function repository(category?: string, ...props: any[]) {
  return (original: Function) => {
    return injectable(category, true, ...props)(original);
  };
}
