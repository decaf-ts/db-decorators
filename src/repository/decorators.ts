import {injectable} from "../utils";
import {RepositoryKeys} from "./constants";

/**
 * Defines a class as a repository (makes it injectable)
 *
 * @decorator repository
 * @namespace Decorators
 * @memberOf Model
 */
export const repository = () => (original: Function) => {
    return injectable(RepositoryKeys.REPO, true)(original);
}