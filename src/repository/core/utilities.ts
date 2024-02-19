import {all, Callback, CriticalError, Err, errorCallback, LoggedError} from "@glass-project1/logging";
import {getPropertyDecorators, ModelKeys} from "@glass-project1/decorator-validation";
import {DBModel} from "../../model";
import {AsyncRepository, ModelCallback, Repository} from "./types";
import {getOperationsRegistry, OperationHandlerAsync, OperationHandlerSync, OperationKeys} from "./operations";


/**
 * @summary Calls the handlers for each db decorator
 *
 * @param {Repository<T>} repo
 * @param {T} model
 * @param {{}} decorators
 *
 * @function enforceDBPropertyDecorators
 *
 * @memberOf module:db-decorators.Repository
 */
export const enforceDBDecorators = function <T extends DBModel>(repo: Repository<T>, model: T, decorators: {[indexer: string]: any[]}): T {
    Object.keys(decorators).forEach(prop => {
        const decs: any[] = decorators[prop];
        const handlers: OperationHandlerSync<T>[] | undefined = getOperationsRegistry().get(model, prop, decs[0].key);
        if (!handlers)
            throw new LoggedError(`Could not find registered handler for the operation ${prop}`);

        const args = [...(decs[0].props.args as []),...(decs[0].props.props as [])];

        handlers.forEach((h: OperationHandlerSync<any>) => h.call(repo, "", model, ...args));
    });

    return model;
}

/**
 * @summary retrieves the arguments for the handler
 * @param {any} dec the decorator
 * @param {string} prop the property name
 * @param {{}} m the model
 * @param {{}} [accum] accumulator used for internal recursiveness
 *
 * @function getHandlerArgs
 * @memberOf module:db-decorators.Repository
 */
export const getHandlerArgs = function(dec: any, prop: string, m: {constructor: {name: string}}, accum?: {[indexer: string]: {args: string[]}}): {[indexer: string]: {args: string[]}} | void{
    const name = m.constructor.name;
    if (!name)
        throw new CriticalError( "Could not determine model class", enforceDBDecoratorsAsync);
    accum = accum || {};

    if (dec.props.handlers[name] && dec.props.handlers[name][prop])
        accum = {...dec.props.handlers[name][prop], ...accum}

    let proto = Object.getPrototypeOf(m);
    if (proto === Object.prototype)
        return accum;
    if (proto.constructor.name === name)
        proto = Object.getPrototypeOf(proto)

    return getHandlerArgs(dec, prop, proto, accum);
}

/**
 * @summary calls handlers for each decorator (async version)
 * @param {Repository<T>} repo
 * @param {T} model
 * @param {{}} decorators
 * @param {string} [keyPrefix] defaults to ''
 * @param {ModelCallback} callback
 *
 * @function enforceDBPropertyDecoratorsAsync
 *
 * @memberOf module:db-decorators.Repository
 */
export const enforceDBDecoratorsAsync = function <T extends DBModel>(repo: AsyncRepository<T>, model: T, decorators: {[indexer: string]: any[]}, keyPrefix: string = "", ...results: any[]) {
    const callback: ModelCallback<T> = results.pop();

    const propIterator = function (props: string[], callback: ModelCallback<T>) {
        const prop = props.shift();
        if (!prop)
            return callback();
        const decs: any[] = decorators[prop];

        const decoratorIterator = function(decorators: any[], callback: Callback){

            const dec = decorators.shift();
            if (!dec)
                return callback();

            const handlers: OperationHandlerAsync<T>[] | undefined = getOperationsRegistry().get(model, prop, keyPrefix + dec.key);
            if (!handlers || !handlers.length)
                return errorCallback.call(enforceDBDecoratorsAsync, `Could not find registered handler for the operation ${prop}`, callback);

            const handlerIterator = function(handlers: OperationHandlerAsync<T>[], args: {args: any[]}[], callback: ModelCallback<T>){
                if (handlers.length !== args.length)
                    return errorCallback.call(enforceDBDecoratorsAsync, "Args and handlers length do not match", callback);
                const handler = handlers.shift();
                if (!handler)
                    return callback();

                const arg = args.shift() as {args: any[]};

                handler.call(repo, prop, model, ...(arg.args || []), ...(results || []), (err: Err) => {
                    if (err)
                        return errorCallback.call(enforceDBDecoratorsAsync, `Error running Operation Handler: {0}`, callback, err);
                    handlerIterator(handlers, args, callback);
                });
            }

            let handlerArgs: {[indexer: string]: {args: string[]}};
            try {
                handlerArgs = getHandlerArgs(dec, prop, model as {constructor: {name: string}}) as {[indexer: string]: {args: string[]}};
            } catch (e: any) {
                return errorCallback.call(enforceDBDecoratorsAsync, "Could not get handler arguments: {0}", callback, e);
            }

            handlerIterator(handlers.slice(), Object.values(handlerArgs), (err: Err, updatedModel?: T) => {
                if (err)
                    return errorCallback.call(enforceDBDecoratorsAsync, err , callback);
                decoratorIterator(decorators, callback);
            });
        }

        decoratorIterator(decs.slice(), (err: Err) => {
            if (err)
                return errorCallback.call(enforceDBDecoratorsAsync, err, callback);
            propIterator(props, callback);
        })

    }

    propIterator(Object.keys(decorators), (err: Err) => {
        if (err)
            return callback(err);
        callback(undefined, model);
    });
}

/**
 * @summary Retrieves the decorators for an object's properties prefixed by {@param prefixes}
 *
 * @param {T} model
 * @param {string[]} prefixes
 *
 * @function getAllPropertyDecorators
 *
 * @memberOf module:db-decorators.Repository
 */
export const getAllPropertyDecorators = function <T extends DBModel>(model: T, ...prefixes: string[]): { [indexer: string]: any[] } | undefined {
    if (!prefixes || !prefixes.length)
        return;

    const pushOrCreate = function (accum: { [indexer: string]: { [indexer: string]: any } }, key: string, decorators: any[]) {
        if (!decorators || !decorators.length)
            return;
        if (!accum[key])
            accum[key] = [];
        accum[key].push(...decorators);
    }

    return Object.getOwnPropertyNames(model).reduce((accum: {} | undefined, propKey) => {
        prefixes.forEach((p, index) => {
            const decorators: { prop: string | symbol, decorators: any[] } = getPropertyDecorators(p, model, propKey, index !== 0);
            if (!accum)
                accum = {};
            pushOrCreate(accum, propKey, decorators.decorators);
        });
        return accum;
    }, undefined);
}

/**
 * @summary Retrieves the decorators for an object's properties prefixed by {@param prefixes} recursively
 * @param model
 * @param accum
 * @param prefixes
 *
 * @function getAllPropertyDecoratorsRecursive
 * @memberOf module:db-decorators.Repository
 */
export const getAllPropertyDecoratorsRecursive = function <T extends DBModel>(model: T, accum: {[indexer: string]: any[] } | undefined, ...prefixes: string[]): { [indexer: string]: any[] } | undefined {
    const accumulator = accum || {};
    const mergeDecorators = function(decs: { [indexer: string]: any[] }){

        const pushOrSquash = (key: string, ...values: any[])  => {
            values.forEach((val) => {
                let match: any;
                if (!(match = accumulator[key].find(e => e.key === val.key)) || match.props.operation !== val.props.operation){
                    accumulator[key].push(val);
                    return;
                }

                if (val.key === ModelKeys.TYPE)
                    return;

                const {handlers, operation} = val.props;

                if (!operation || !operation.match(new RegExp(`^(:?${OperationKeys.ON}|${OperationKeys.AFTER})(:?${OperationKeys.CREATE}|${OperationKeys.READ}|${OperationKeys.UPDATE}|${OperationKeys.DELETE})$`))){
                    accumulator[key].push(val)
                    return;
                }

                const accumHandlers = match.props.handlers;

                Object.entries(handlers).forEach(([clazz, handlerDef]) => {
                    if (!(clazz in accumHandlers)){
                        accumHandlers[clazz] = handlerDef
                        return;
                    }

                    Object.entries(handlerDef as {}).forEach(([handlerProp, handler]) => {
                        if (!(handlerProp in accumHandlers[clazz])){
                            accumHandlers[clazz][handlerProp] =  handler;
                            return;
                        }

                        Object.entries(handler as {}).forEach(([handlerKey, argsObj]) => {
                            if (!(handlerKey in accumHandlers[clazz][handlerProp])){
                                accumHandlers[clazz][handlerProp][handlerKey] = argsObj
                                return;
                            }
                            all.call(getAllPropertyDecoratorsRecursive, "Skipping handler registration for {0} under prop {0} because handler is the same", clazz, handlerProp)
                        })
                    })
                })
            })
        }

        Object.entries(decs).forEach(([key, value]) => {
            accumulator[key] = accumulator[key] || [];
            pushOrSquash(key, ...value)
            // accumulator[key].push(...value);
        })
    }

    const decs: { [indexer: string]: any[] } | undefined = getAllPropertyDecorators(model, ...prefixes);
    if (decs)
        mergeDecorators(decs);

    if (Object.getPrototypeOf(model) === Object.prototype)
        return accumulator;

    const name = model.constructor.name;
    let proto = Object.getPrototypeOf(model);
    if (!proto)
        return accumulator
    // if (proto.constructor && proto.constructor.name === name)
    //     proto = Object.getPrototypeOf(proto)
    return getAllPropertyDecoratorsRecursive(proto, accumulator, ...prefixes);
}


/**
 * @summary retrieves all DB Decorators
 * @param {T} model
 * @param {string} operation CRUD {@link OperationKeys}
 * @param {string} [extraPrefix]
 *
 * @function getDbPropertyDecorators
 *
 * @memberOf module:db-decorators.Repository
 */
export const getDbDecorators = function <T extends DBModel>(model: T, operation: string, extraPrefix?: string): { [indexer: string]: { [indexer: string]: any[] } } | undefined {
    const decorators = getAllPropertyDecoratorsRecursive(model, undefined, OperationKeys.REFLECT + (extraPrefix ? extraPrefix : ''));
    if (!decorators)
        return;
    return Object.keys(decorators).reduce((accum: { [indexer: string]: any } | undefined, decorator) => {
        const dec = decorators[decorator].filter(d => d.key === operation);
        if (dec && dec.length) {
            if (!accum)
                accum = {};
            accum[decorator] = dec;
        }
        return accum;
    }, undefined);
}
