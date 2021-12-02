import {injectable} from "../";
import {RepositoryKeys} from "./constants";
import {Callback, Err, Transaction} from "./repository";

/**
 * Defines a class as a repository (makes it injectable)
 * and forces an instantiation over any other possible with that key
 *
 * @param {any[]} [props] optional props to be passed to {@link injectable}
 *
 * @see injectable
 * with args:
 *  - category: {@link RepositoryKeys.REPO};
 *  - singleton: true;
 *  - force: true;
 *  - args: {@param props}
 *
 * @decorator repository
 * @namespace decorators
 * @memberOf repository
 */
export function repository(...props: any[]){
    return (original: Function) => {
        return injectable(RepositoryKeys.REPO, true, true, ...props)(original);
    }
}

function AsyncLock() {
    const p = () => new Promise(next => nextIter = next );
    // @ts-ignore
    let nextIter, next = p();
    const nextP = () => {
        const result = next;
        next = result.then(() => p());
        return result;
    }
    // @ts-ignore
    nextIter();
    return Object.assign({}, {
        async * [Symbol.asyncIterator] () {
            try {
                yield nextP()
            } catch (e) {
                // do nothing
            } finally {
                // @ts-ignore
                nextIter()
            }
        }
    });
}

export function transactional(isAsync: boolean = true) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        const oldMethod = descriptor.value;

        const syncOrAsync = function(...args: any[]){
            const callback: Callback = args.pop();
            if (!isAsync){
                let results: any;
                try {
                    results = oldMethod.call(target, ...args);
                } catch (e) {
                    return callback(e);
                }
                return callback(undefined, results);
            }

            oldMethod.call(target, ...args, (err: Err, ...argz: any[]) => {
                if (err)
                    return callback(err);
                callback(undefined, ...argz);
            });
        }

        
        const methodWrapper = (...args: any[]) => {
            let callback: Callback, transaction = args.shift();
            if (isAsync)
                callback = args.pop();
            if (transaction instanceof Transaction){
                transaction = new Transaction(transaction);
            } else {
                transaction = new Transaction(target.constructor.name, propertyKey, isAsync, () => {
                    syncOrAsync((err: Err, ...argz: any[]) => {
                        callback(err, ...argz);
                    });
                });
            }
        }

        descriptor.value = methodWrapper;

        target[RepositoryKeys.REPO_CACHE] = target[RepositoryKeys.REPO_CACHE] || [];
        // if (target[RepositoryKeys.REPO_CACHE].length)

        //console.log(target, propertyKey, descriptor)
    };
}