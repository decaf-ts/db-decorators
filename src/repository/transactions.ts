import {Callback, Err} from "./repository";
import {RepositoryKeys} from "./constants";
import {all, info} from "../logging";
import {CriticalError} from "../errors";
import {getAllPropertyDecorators, prefixMethodAsync} from "../utils";
import {DBKeys, DEFAULT_ERROR_MESSAGES} from "../model";
import {ValidationKeys} from "@tvenceslau/decorator-validation/lib";

export interface TransactionLock {
    submit(transaction: Transaction): void;
    release(): void;
}

const getRepoKeyKey = (key: string) => RepositoryKeys.REFLECT + key;

/**
 * Simple Synchronous Lock implementation for transaction management
 * adapted from {@link https://www.talkinghightech.com/en/creating-a-js-lock-for-a-resource/}
 */
export class SyncronousLock implements TransactionLock {
    private counter: number;
    private pendingTransactions: Transaction[];
    private currentTransaction?: number = undefined;

    /**
     * @param {number} [counter] the number of simultaneous transactions allowed. defaults to 1
     */
    constructor(counter: number = 1) {
        this.counter = counter;
        this.pendingTransactions = [];
    }

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

    private fireTransaction(transaction: Transaction){
        this.currentTransaction = transaction.id;
        all(`Firing transaction {0}. {1} remaining...`, transaction.id, this.pendingTransactions.length);
        return transaction.fire();
    }

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

export function getTransactionLock(){
    if (!currentLock)
        currentLock = new SyncronousLock();
    return currentLock;
}

export function setTransactionLock(newLock: TransactionLock){
    currentLock = newLock;
}

export class Transaction {
    readonly id: number;
    protected action?: () => any;
    readonly method?: string;
    readonly source?: string;
    readonly log: string[];

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

        const boundObj = Object.keys(obj).reduce((accum: any, k) => {
            if (Object.keys(transactionalMethods).indexOf(k) !== -1 && transactionalMethods[k].find(o => o.key === RepositoryKeys.TRANSACTIONAL))
                accum[k] = (...args: any[]) => obj[k].call(obj, self, ...args);
            else
                accum[k] = typeof obj[k] === 'function' ? obj[k].bind(obj) : obj[k];
            return accum;
        }, {});

        return boundObj;
    }

    fire(){
        if (!this.action)
            throw new CriticalError(`Missing the method`);
        return this.action();
    }

    toString(withId: boolean = true){
        return `${withId ? `[${this.id}]` : ''}[Transaction][${this.source}.${this.method}`;
    }
}

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