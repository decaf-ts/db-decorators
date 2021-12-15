import {Callback, Err} from "./repository";
import {RepositoryKeys} from "./constants";
import {all, info} from "../logging";
import {CriticalError} from "../errors";
import {getAllProperties, getAllPropertyDecorators, prefixMethodAsync} from "../utils";
import {DBKeys, DEFAULT_ERROR_MESSAGES} from "../model";
import {ValidationKeys} from "@tvenceslau/decorator-validation/lib";

/**
 * @namespace db-decorators.repository.transactions
 * @memberOf db-decorators.repository
 */

/**
 * @interface TransactionLock
 */
export interface TransactionLock {
    /**
     * Submits a transaction to be processed
     * @param {Transaction} transaction
     */
    submit(transaction: Transaction): void;

    /**
     * Releases The lock after the conclusion of a transaction
     */
    release(): void;
}

/**
 * @function getRepoKey
 * @param {string} key
 * @memberOf db-decorators.repository.transactions
 */
const getRepoKeyKey = (key: string) => RepositoryKeys.REFLECT + key;

/**
 * Simple Synchronous Lock implementation for transaction management
 * adapted from {@link https://www.talkinghightech.com/en/creating-a-js-lock-for-a-resource/}
 *
 * @class SyncronousLock
 * @implements TransactionLock
 *
 */
export class SyncronousLock implements TransactionLock {
    private counter: number;
    private pendingTransactions: Transaction[];
    private currentTransaction?: number = undefined;

    /**
     * @constructor
     * @param {number} [counter] the number of simultaneous transactions allowed. defaults to 1
     */
    constructor(counter: number = 1) {
        this.counter = counter;
        this.pendingTransactions = [];
    }

    /**
     * Submits a transaction to be processed
     * @param {Transaction} transaction
     */
    submit(transaction: Transaction): void {
        if (this.currentTransaction && this.currentTransaction === transaction.id){
            all(`Continuing transaction {0}`, transaction.id);
            return transaction.fire();
        }

        if (this.counter > 0) {
            this.counter--;
            return this.fireTransaction(transaction);
        } else {
            all(`Locking transaction {0}`, transaction.id);
            this.pendingTransactions.push(transaction);
        }
    }

    /**
     * Executes a transaction
     *
     * @param {Transaction} transaction
     * @private
     */
    private fireTransaction(transaction: Transaction){
        this.currentTransaction = transaction.id;
        all(`Firing transaction {0}. {1} remaining...`, transaction.id, this.pendingTransactions.length);
        return transaction.fire();
    }
    /**
     * Releases The lock after the conclusion of a transaction
     */
    release(): void {
        this.currentTransaction = undefined;
        if (this.pendingTransactions.length > 0) {
            const transaction = this.pendingTransactions.shift() as Transaction;

            const self = this;
            const cb = () => self.fireTransaction.call(self, transaction);

            all(`Releasing Transaction Lock on transaction {0}`, transaction.id);

            // @ts-ignore
            if(typeof window === 'undefined')
                process.nextTick(cb); // if you are on node
            else
                setTimeout(cb,0); // if you are in the browser
        } else {
            this.counter++;
        }
    }
}

let currentLock: TransactionLock;

/**
 * @function getTransactionLock
 * @memberOf db-decorators.repository.transactions
 */
export function getTransactionLock(){
    if (!currentLock)
        currentLock = new SyncronousLock();
    return currentLock;
}

/**
 * sets a new transaction lock
 * @param {TransactionLock} newLock
 *
 * @memberOf db-decorators.repository.transactions
 */
export function setTransactionLock(newLock: TransactionLock){
    currentLock = newLock;
}

/**
 * @class Transaction
 */
export class Transaction {
    readonly id: number;
    protected action?: () => any;
    readonly method?: string;
    readonly source?: string;
    readonly log: string[];

    /**
     *
     * @param {string} source
     * @param {string} [method]
     * @param {function(): void} [action]
     */
    constructor(source: string, method?: string, action?: () => any) {
        this.id = Date.now();
        this.action = action;
        this.method = method;
        this.log = [[this.id, source, method].join(' | ')]
        this.source = source;
    }

    /**
     * Binds a new operation to the current transaction
     * @param {Transaction} nextTransaction
     */
    bindTransaction(nextTransaction: Transaction){
        all(`Binding the {0} to {1}`, nextTransaction, this);
        this.log.push(...nextTransaction.log);
        this.action = nextTransaction.action;
    }

    /**
     * Binds the Transactional Decorated Object to the transaction by having all {@link transactional} decorated
     * methods always pass the current Transaction as an argument
     *
     * @param {any} obj
     * @return {any} the bound {@param obj}
     */
    bindToTransaction(obj: any): any{

        const transactionalMethods = getAllPropertyDecorators(obj, RepositoryKeys.REFLECT);
        if (!transactionalMethods)
            return obj;
        const self = this;

        const boundObj = getAllProperties(obj).reduce((accum: any, k) => {
            if (Object.keys(transactionalMethods).indexOf(k) !== -1 && transactionalMethods[k].find(o => o.key === RepositoryKeys.TRANSACTIONAL))
                accum[k] = (...args: any[]) => obj[k].call(obj.__originalObj || obj, self, ...args);
            else if (k === 'clazz' || k === 'constructor')
                accum[k] = obj[k];
            else
                accum[k] = typeof obj[k] === 'function' ? obj[k].bind(obj. __originalObj || obj) : obj[k];
            return accum;
        }, {});

        boundObj[DBKeys.ORIGINAL] = obj.__originalObj || obj;

        return boundObj;
    }

    /**
     * Fires the Transaction
     */
    fire(){
        if (!this.action)
            throw new CriticalError(`Missing the method`);
        return this.action();
    }

    toString(withId: boolean = true){
        return `${withId ? `[${this.id}]` : ''}[Transaction][${this.source}.${this.method}`;
    }
}

/**
 * Sets a class Async method as transactional
 *
 * @decorator transactionalAsync
 *
 * @category Decorators
 *
 * @memberOf db-decorators.repository.transactions
 */
export function transactionalAsync() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(
            getRepoKeyKey(RepositoryKeys.TRANSACTIONAL),
            {},
            target,
            propertyKey
        );

        const originalMethod = descriptor.value;

        const methodWrapper = function(this: any, ...args: any[]){
            let callback: Callback = args.pop();
            if (!callback || typeof callback !== 'function')
                throw new CriticalError(`Missing Callback`);

            const cb = (...args: any[]) => {
                getTransactionLock().release();
                callback(...args);
            }

            const self = this;

            let transaction = args.shift();
            if (transaction instanceof Transaction){
                const updatedTransaction: Transaction = new Transaction(this.constructor.name, propertyKey,  () => {
                    return originalMethod.call(updatedTransaction.bindToTransaction(self), ...args, callback);
                });

                transaction.bindTransaction(updatedTransaction);
                transaction.fire();
            } else {
                args.unshift(transaction);
                transaction = undefined;
                transaction = new Transaction(this.constructor.name, propertyKey,  () => {
                    return originalMethod.call(transaction.bindToTransaction(self), ...args, cb);
                });
                getTransactionLock().submit(transaction);
            }
        }

        descriptor.value = methodWrapper;
    }
}

/**
 * Sets a class Async method as transactional
 *
 * @decorator transactionalAsync
 *
 * @category Decorators
 *
 * @memberOf db-decorators.repository.transactions
 */
export function transactional() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

        const oldMethod = descriptor.value;

        const methodWrapper = (...args: any[]) => {
            let transaction = args.shift();
            if (transaction instanceof Transaction){
                // @ts-ignore
                transaction = new Transaction(transaction);
            } else {
                transaction = new Transaction(target.constructor.name, propertyKey,  () => {
                    return target[propertyKey].call(target, ...args);
                });
            }
        }

        descriptor.value = methodWrapper;

        target[RepositoryKeys.REPO_CACHE] = target[RepositoryKeys.REPO_CACHE] || [];
        // if (target[RepositoryKeys.REPO_CACHE].length)

        //console.log(target, propertyKey, descriptor)
    };
}