import {BuilderRegistry} from "@tvenceslau/decorator-validation/lib/utils/registry";

export type InjectablesRegistry = BuilderRegistry<any>;

export class InjectableRegistryImp implements InjectablesRegistry {
    private cache: {[indexer: string]: {[indexer: string] : any}} = {};

    get<T>(category: string, name: string): T | undefined {
        return undefined;
    }

    register<T>(obj: T, category: string): void {

    }

    build(obj: { [p: string]: any }, args: any): any {

    }

}

let actingInjectablesRegistry: InjectablesRegistry;

/**
 * Returns the current {@link InjectableRegistryImp}
 * @function getInjectablesRegistry
 * @return InjectablesRegistry, defaults to {@link InjectableRegistryImp}
 * @memberOf injectables
 */
export function getInjectablesRegistry(): InjectablesRegistry {
    if (!actingInjectablesRegistry)
        actingInjectablesRegistry = new InjectableRegistryImp();
    return actingInjectablesRegistry;
}

/**
 * Returns the current OperationsRegistry
 * @function getOperationsRegistry
 * @prop {InjectablesRegistry} injectablesRegistry the new implementation of Registry
 * @memberOf injectables
 */
export function setInjectablesRegistry(operationsRegistry: InjectablesRegistry){
    actingInjectablesRegistry = operationsRegistry;
}