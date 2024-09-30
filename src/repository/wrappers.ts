/**
 * @summary Util method to change a method of an object prefixing it with another
 * @param {any} obj The Base Object
 * @param {Function} after The original method
 * @param {Function} prefix The Prefix method. The output will be used as arguments in the original method
 * @param {string} [afterName] When the after function anme cannot be extracted, pass it here
 *
 * @function prefixMethod
 *
 * @memberOf module:db-decorators.Repository
 */
export function prefixMethod(
  obj: any,
  after: (...args: any[]) => any,
  prefix: (...args: any[]) => any,
  afterName?: string,
) {
  async function wrapper(this: any, ...args: any[]) {
    const results = await Promise.resolve(prefix.call(this, ...args));
    return Promise.resolve(after.apply(this, results));
  }
  const wrapped = wrapper.bind(obj);
  const name = afterName ? afterName : after.name;
  Object.defineProperty(wrapped, "name", {
    enumerable: true,
    configurable: true,
    writable: false,
    value: name,
  });
  obj[name] = wrapped;
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
  beforeName?: string,
) {
  async function wrapper(this: any, ...args: any[]) {
    const results = await Promise.resolve(before.call(this, ...args));
    return suffix.call(this, ...results);
  }
  const wrapped = wrapper.bind(obj);
  const name = beforeName ? beforeName : before.name;
  Object.defineProperty(wrapped, "name", {
    enumerable: true,
    configurable: true,
    writable: false,
    value: name,
  });
  obj[name] = wrapped;
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
 * @function wrapMethod
 *
 * @memberOf module:db-decorators.Repository
 */
export function wrapMethod(
  obj: any,
  before: (...args: any[]) => any,
  method: (...args: any[]) => any,
  after: (...args: any[]) => any,
  methodName?: string,
) {
  async function wrapper(this: any, ...args: any[]) {
    const transformedArgs = await Promise.resolve(before.call(obj, ...args));
    const results = await Promise.resolve(method.call(obj, ...transformedArgs));
    return Promise.resolve(after.call(this, results));
  }
  const wrapped = wrapper.bind(obj);
  const name = methodName ? methodName : method.name;
  Object.defineProperty(wrapped, "name", {
    enumerable: true,
    configurable: true,
    writable: false,
    value: name,
  });
  obj[name] = wrapped;
}
