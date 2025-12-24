import { Context } from "./Context";
import { InternalError } from "./errors";
import { Model } from "@decaf-ts/decorator-validation";

/**
 * @summary Util method to change a method of an object prefixing it with another
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function anme cannot be extracted, pass it here
 *
 * @function prefixMethod
 *
 * @memberOf module:db-decorators
 */
export function prefixMethod(
  obj: any,
  after: (...args: any[]) => any,
  prefix: (...args: any[]) => any,
  afterName?: string
) {
  const name = afterName ? afterName : after.name;

  obj[name] = new Proxy(obj[name], {
    apply: async (target, thisArg, argArray) => {
      let results = prefix.call(thisArg, ...argArray);
      if (results instanceof Promise) results = await results;

      results = target.call(thisArg, ...results);

      if (results instanceof Promise) results = await results;

      return results;
    },
  });
}

/**
 * @summary Util method to change a method of an object suffixing it with another
 * @param {any} obj The Base Object
 * @param {Function} before The original method
 * @param {Function} suffix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [beforeName] When the after function anme cannot be extracted, pass it here
 *
 * @function suffixMethod
 *
 * @memberOf module:db-decorators.Repository
 */
export function suffixMethod(
  obj: any,
  before: (...args: any[]) => any,
  suffix: (...args: any[]) => any,
  beforeName?: string
) {
  const name = beforeName ? beforeName : before.name;
  obj[name] = new Proxy(obj[name], {
    apply: async (target, thisArg, argArray) => {
      let results = target.call(thisArg, ...argArray);
      if (results instanceof Promise) results = await results;

      results = suffix.call(thisArg, ...results);

      if (results instanceof Promise) results = await results;

      return results;
    },
  });
}

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
 * @memberOf module:db-decorators
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
      let results = target.call(thisArg, ...transformedArgs);
      if (results instanceof Promise) results = await results;
      results = after.call(thisArg, results, context);
      if (results instanceof Promise) results = await results;
      return results;
    },
  });
}

export function wrapMethodWithContextForUpdate(
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
      const oldModel = transformedArgs.pop();
      const context = transformedArgs[transformedArgs.length - 1] as any;
      if (!(context instanceof Context))
        throw new InternalError("Missing a context");
      if (
        context.get("applyUpdateValidation") &&
        !context.get("ignoreDevSafeGuards") &&
        !(oldModel instanceof Model) &&
        (!Array.isArray(oldModel) || !oldModel.every((o) => o instanceof Model))
      ) {
        throw new InternalError(`No previous versions os models found`);
      }

      let results = target.call(thisArg, ...transformedArgs);
      if (results instanceof Promise) results = await results;
      results = after.call(thisArg, results, oldModel, context);
      if (results instanceof Promise) results = await results;
      return results;
    },
  });
}
