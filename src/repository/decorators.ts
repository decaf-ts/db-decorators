import {injectable} from "../";

/**
 * Defines a class as a repository (makes it injectable)
 * and forces an instantiation over any other possible with that key
 *
 * @param {any[]} [props] optional props to be passed to {@link injectable}
 *
 * @see injectable
 * with args:
 *  - singleton: true;
 *  - force: true;
 *  - args: {@param props}
 *
 * @decorator repository
 *
 * @category Decorators
 */
export function repository(...props: any[]){
    return (original: Function) => {
        return injectable(true, true, ...props)(original);
    }
}