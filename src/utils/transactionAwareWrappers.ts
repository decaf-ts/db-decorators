import {Callback, Err} from "@glass-project1/logging";
import {Transaction} from "../repository/core/transactions";

/**
 * @summary The Async version of {@link wrapMethod}
 *
 * @param {any} obj The Base Object
 * @param {Function} before the method to be prefixed
 * @param {Function} method the method to be wrapped
 * @param {Function} after The method to be suffixed
 * @param {string} [methodName] When the after function name cannot be extracted, pass it here
 *
 * @function wrapMethodAsync
 *
 * @memberOf module:db-decorators.Transactions
 */
export function transactionAwareWrapMethodAsync(obj: any, before: Function, method: Function, after: Function, methodName?: string){
    function wrapper(this: any, ...args: any[]){
        const callback: Callback = args.pop();
        const self = this

        const arg = args.shift();
        if (!(arg instanceof Transaction))
            args.unshift(arg)
        return before.call(self, ...args, (err: Err, ...transformedArgs: any[]) => {
            if (err)
                return callback(err);
            if (arg instanceof Transaction)
                transformedArgs = [arg, ...transformedArgs]
            method.call(self, ...transformedArgs, (err: Err, ...results: any[]) => {
                if (err)
                    return callback(err);
                after.call(self, ...results, (err: Err, ...otherResults: any[]) => {
                    if (err)
                        return callback(err);
                    callback(undefined, ...otherResults);
                });
            });
        });
    }

    obj[methodName ? methodName : method.name] = wrapper;
}