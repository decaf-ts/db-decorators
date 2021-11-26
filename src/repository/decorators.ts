import {injectable} from "../utils";
import {RepositoryKeys} from "./constants";

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

export type Transaction = {id: string, transaction: () => void};

export function transactional() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        target[RepositoryKeys.REPO_CACHE] = target[RepositoryKeys.REPO_CACHE] || [];
        //console.log(target, propertyKey, descriptor)
    };
}