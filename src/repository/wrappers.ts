import { Context } from "./Context";
import { InternalError } from "./errors";

/**
 * @summary Util method to wrap a method of an object with additional logic
 *
 * @param {any} obj The Base Object
 * @param {Function} before the method to be prefixed
 * @param {Function} method the method to be wrapped
 * @param {Function} after The method to be suffixed
 * @param {string} [methodName] When the after function anme cannot be extracted, pass it here
 *
 * @function wrapMethodWithContext
 *
 * @memberOf module:db-decorators.Repository
 */
export function wrapMethodWithContext(
  obj: any,
  before: (...args: any[]) => any,
  method: (...args: any[]) => any,
  after: (...args: any[]) => any,
  methodName?: string
) {
  const name = methodName ? methodName : method.name;
  obj[name] = new Proxy(obj[name], {
    apply: async (target, thisArg, argArray) => {
      let transformedArgs = before.call(thisArg, ...argArray);
      if (transformedArgs instanceof Promise)
        transformedArgs = await transformedArgs;
      const context = transformedArgs[transformedArgs.length - 1] as any;
      if (!(context instanceof Context))
        throw new InternalError("Missing a context");
      let results = await target.call(thisArg, ...transformedArgs);
      if (results instanceof Promise) results = await results;
      results = after.call(thisArg, results, context);
      if (results instanceof Promise) results = await results;
      return results;
    },
  });
}
