import {all, CriticalError, Callback, getObjectName, Err, debug, error, warn} from "@glass-project1/logging";
import {RepositoryKeys} from "./constants";
import {getAllPropertyDecoratorsRecursive} from "./utilities";
import {DBKeys} from "../../utils/constants";
import {getAllProperties} from "../../utils/general";
import {getClassDecorators} from "@glass-project1/decorator-validation";

/**
 * @summary defines a callable as perceived by the lock
 *
 * @memberOf module:db-decorators.Transactions
 */
export type LockCallable = (value: (void | PromiseLike<void>)) => void

/**
 * @summary Simple Promise based Lock class
 *
 * @class Lock
 * @category Transactions
 */
export class Lock {
    private queue: LockCallable[] = [];
    private locked = false;

    /**
     * @summary executes when lock is available
     * @param {Function} func
     */
    async execute (func: () => any) {
        const self = this;
        return self.acquire()
            .then(func)
            .then((r) => {
                self.release();
                return r;
            }, (err) => {
                self.release();
                throw err;
            })
    }

    /**
     * @summary waits to acquire the lock
     * @param {string} [issuer]
     */
    async acquire(issuer?: string): Promise<void>{
        all.call(issuer || this, "trying to acquire lock")
        const self = this;
        if (self.locked){
            return new Promise<void>(((resolve) => self.queue.push(resolve)))
        } else {
            self.locked = true;
            all.call(issuer || this, "lock Acquired")
            return Promise.resolve();
        }
    }

    /**
     * @summary releases the lock
     * @param {string} [issuer]
     */
    release(issuer?: string) {
        const self = this;
        const next: LockCallable | undefined = self.queue.shift();
        if (next) {
            all.call(issuer || self, "Scheduling locked callable")

            const cb = () => {
                all.call(issuer || self, "Running scheduled callable")
                next()
            }

            if(typeof (globalThis as unknown as {window: any}).window === 'undefined')
                globalThis.process.nextTick(cb); // if you are on node
            else
                setTimeout(cb,0); // if you are in the browser
        } else {
            all.call(issuer || self, "Lock released")
            self.locked = false;
        }
    }
}

/**
 * @summary Transaction lock interface
 * @interface TransactionLock
 *
 * @category Transactions
 */
export interface TransactionLock {
    /**
     * @summary stores the current transactions
     * @property currentTransaction
     */
    currentTransaction?: Transaction
    /**
     * @summary Submits a transaction to be processed
     * @param {Transaction} transaction
     * @method
     */
    submit(transaction: Transaction): void;

    /**
     * @summary Releases The lock after the conclusion of a transaction
     * @param {Err} [err] the error (if any) that caused the release
     * @method
     */
    release(err?: Err): Promise<void>;
}

/**
 * @summary gets the transactions reflections key
 * @function getRepoKey
 * @param {string} key
 * @memberOf module:db-decorators.Transactions
 * */
export const getRepoKeyKey = (key: string) => RepositoryKeys.REFLECT + key;

/**
 * @summary Simple Synchronous Lock implementation
 * @description for transaction management
 * adapted from {@link https://www.talkinghightech.com/en/creating-a-js-lock-for-a-resource/}
 *
 * @param {number} [counter] the number of simultaneous transactions allowed. defaults to 1
 * @param {Function} [onBegin] to be called at the start of the transaction
 * @param {Function} [onEnd] to be called at the conclusion of the transaction
 *
 * @class SyncronousLock
 * @implements TransactionLock
 *
 * @category Transactions
 */
export class SyncronousLock implements TransactionLock {
    private counter: number;
    private pendingTransactions: Transaction[];
    currentTransaction?: Transaction = undefined;
    private readonly onBegin?: () => Promise<void>;
    private readonly onEnd?: (err?: Err) => Promise<void>;

    private readonly lock = new Lock()

    constructor(counter: number = 1, onBegin?: () => Promise<void>, onEnd?: (err?: Err) => Promise<void>) {
        this.counter = counter;
        this.pendingTransactions = [];
        this.onBegin = onBegin;
        this.onEnd = onEnd;
    }

    /**
     * @summary Submits a transaction to be processed
     * @param {Transaction} transaction
     */
    submit(transaction: Transaction): void {
        const self = this;
        self.lock.acquire(self.submit.name).then(_ => {
            if (self.currentTransaction && self.currentTransaction.id === transaction.id){
                self.lock.release(self.submit.name)
                all(`Continuing transaction {0}`, transaction.id);
                return transaction.fire();
            }

            if (self.counter > 0) {
                self.counter--;
                self.lock.release(self.submit.name)
                return self.fireTransaction(transaction);
            } else {
                all(`Locking transaction {0}`, transaction.id);
                self.pendingTransactions.push(transaction);
                self.lock.release(self.submit.name)
            }
        })
    }

    /**
     * @summary Executes a transaction
     *
     * @param {Transaction} transaction
     * @private
     */
    private fireTransaction(transaction: Transaction){
        const self = this;
        self.lock.acquire(self.fireTransaction.name).then(_ => {
            self.currentTransaction = transaction;
            self.lock.release(self.fireTransaction.name)
            if (self.onBegin)
                self.onBegin()
                    .then(_ => all.call(self,`Called onBegin before firing transaction {0}`, transaction.id))
                    .catch((e: any) => error.call(self, "Failed to run transaction onBegin: {0}", e))
                    .then(_ => {
                        all.call(self,`Firing transaction {0}. {1} remaining...`, transaction.id, this.pendingTransactions.length);
                        transaction.fire();
                    })
            else {
                all.call(self,`Firing transaction {0}. {1} remaining...`, transaction.id, this.pendingTransactions.length);
                transaction.fire();
            }
        })
    }
    /**
     * @summary Releases The lock after the conclusion of a transaction
     */
    async release(err?: Err): Promise<void> {
        const self = this;
        return new Promise<void>((resolve) => {
            self.lock.acquire(self.release.name).then(_ => {
                if (!self.currentTransaction)
                    warn.call(self, "Trying to release an unexisting transaction. should never happen...")
                debug.call(self, "Releasing transaction: {0}", self.currentTransaction?.toString(true, true))
                self.currentTransaction = undefined;
                self.lock.release(self.release.name)

                const afterConclusionCB = () => {
                    self.lock.acquire(self.release.name).then(_ => {
                        if (self.pendingTransactions.length > 0) {
                            const transaction = self.pendingTransactions.shift() as Transaction;

                            const cb = () => self.fireTransaction.call(self, transaction);

                            all(`Releasing Transaction Lock on transaction {0}`, transaction.id);

                            if(typeof (globalThis as unknown as {window: any}).window === 'undefined')
                                globalThis.process.nextTick(cb); // if you are on node
                            else
                                setTimeout(cb,0); // if you are in the browser
                        } else {
                            self.counter++;
                        }
                        self.lock.release(self.release.name)
                        resolve()
                    })
                }

                if (self.onEnd)
                    self.onEnd(err)
                        .then(_ => all(`Called onEnd before releasing transaction`))
                        .catch((e: any) => error.call(self, "Failed to run transaction onEnd: {0}", e))
                        .then(_ => afterConclusionCB())
                else
                    afterConclusionCB()
            })
        })
    }
}

/**
 * @summary Transaction Class
 *
 * @param {string} source
 * @param {string} [method]
 * @param {function(): void} [action]
 * @param {any[]} [metadata]
 *
 * @class Transaction
 *
 * @category Transactions
 */
export class Transaction {
    readonly id: number;
    protected action?: () => any;
    readonly method?: string;
    readonly source?: string;
    readonly log: string[];
    private readonly metadata?: any[];

    private static lock: TransactionLock;

    constructor(source: string, method?: string, action?: () => any, metadata?: any[]) {
        this.id = Date.now();
        this.action = action;
        this.method = method;
        this.log = [[this.id, source, method].join(' | ')]
        this.source = source;
        this.metadata = metadata;
    }

    /**
     * @summary Pushes a transaction to que queue and waits its resolution
     *
     * @param {any} issuer any class. will be used as this when calling the callbackMethod
     * @param {Function} callbackMethod callback function containing the transaction. will be called with the issuear as this
     * @param {any[]} args arguments to pass to the method. Last one must be the callback
     */
    static push(issuer: any, callbackMethod: (...argzz: (any | Callback)[]) => void, ...args: (any | Callback)[]){
        const callback: Callback = args.pop();
        if (!callback || typeof callback !== 'function')
            throw new CriticalError("Missing callback", Transaction)
        const cb = (err: Err, ...args: any[]) => {
            this.getLock().release(err)
                .then(_ => callback(err, ...args));
        }
        const transaction: Transaction = new Transaction(issuer.constructor.name, callbackMethod.name ? getObjectName(callbackMethod) : "Anonymous",  () => {
            return callbackMethod.call(transaction.bindToTransaction(issuer), ...args, cb);
        });
        this.getLock().submit(transaction);
    }

    /**
     * @summary Sets the lock to be used
     * @param lock
     */
    static setLock(lock: TransactionLock){
        this.lock = lock;
    }

    /**
     * @summary gets the lock
     */
    static getLock(): TransactionLock{
        if (!this.lock)
            this.lock = new SyncronousLock();
        return this.lock;
    }

    /**
     * @summary submits a transaction
     * @param {Transaction} transaction
     */
    static submit(transaction: Transaction){
        this.getLock().submit(transaction)
    }

    /**
     * @summary releases the lock
     * @param {Err} err
     */
    static async release(err?: Err){
        return this.getLock().release(err)
    }

    /**
     * @summary retrieves the metadata for the transaction
     */
    getMetadata(){
        return this.metadata ? [...this.metadata] : undefined;
    }

    /**
     * @summary Binds a new operation to the current transaction
     * @param {Transaction} nextTransaction
     */
    bindTransaction(nextTransaction: Transaction){
        all(`Binding the {0} to {1}`, nextTransaction, this);
        this.log.push(...nextTransaction.log);
        nextTransaction.bindTransaction = this.bindToTransaction.bind(this)
        nextTransaction.bindToTransaction = this.bindToTransaction.bind(this)
        this.action = nextTransaction.action;
    }

    /**
     * @summary Binds the Transactional Decorated Object to the transaction
     * @description by having all {@link transactional} decorated
     * methods always pass the current Transaction as an argument
     *
     * @param {any} obj
     * @return {any} the bound {@param obj}
     */
    bindToTransaction(obj: any): any{

        const transactionalMethods = getAllPropertyDecoratorsRecursive(obj, undefined, RepositoryKeys.REFLECT);
        if (!transactionalMethods)
            return obj;
        const self = this;


        const boundObj = getAllProperties(obj).reduce((accum: any, k) => {
            if (Object.keys(transactionalMethods).indexOf(k) !== -1 && transactionalMethods[k].find(o => o.key === RepositoryKeys.TRANSACTIONAL))
                accum[k] = (...args: any[]) => obj[k].call(obj.__originalObj || obj, self, ...args);
            else if (k === 'clazz' || k === 'constructor')
                accum[k] = obj[k];
            else if (typeof obj[k] === 'function')
                accum[k] = obj[k].bind(obj. __originalObj || obj);
            else if (typeof obj[k] === 'object' && obj[k].constructor){
                const decs = getClassDecorators(RepositoryKeys.REFLECT, obj[k])
                if (decs.find(e => e.key === RepositoryKeys.TRANSACTIONAL))
                    accum[k] = self.bindToTransaction(obj[k])
                else
                    accum[k] = obj[k]
            } else
                accum[k] = obj[k]

            return accum;
        }, {});

        boundObj[DBKeys.ORIGINAL] = obj[DBKeys.ORIGINAL] || obj;
        boundObj.toString = () => getObjectName(boundObj[DBKeys.ORIGINAL]) + " proxy for transaction " + this.id

        return boundObj;
    }

    /**
     * @summary Fires the Transaction
     */
    fire(){
        if (!this.action)
            throw new CriticalError(`Missing the method`);
        return this.action();
    }

    /**
     * @summary toString override
     * @param {boolean} [withId] defaults to true
     * @param {boolean} [withLog] defaults to true
     */
    toString(withId = true, withLog = false){
        return `${withId ? `[${this.id}]` : ''}[Transaction][${this.source}.${this.method}${withLog
            ?  `]\nTransaction Log:\n${this.log.join("\n")}`
            : "]"}`;
    }
}

/**
 * @summary {@link Transaction} metadata type
 * @memberOf module:db-decorators.Transactions
 */
export type TransactionalMetadata = {
    type: "async" | "promise",
    metadata?: any
}

/**
 * @summary Sets a class Async (promise based) method as transactional
 *
 * @param {any[]}  [metadata] option metadata available to the {@link TransactionLock}
 *
 * @function transactionalPromise
 *
 * @memberOf module:db-decorators.Decorators.transactions
 */
export function transactionalPromise(...metadata: any[]){
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(
            getRepoKeyKey(RepositoryKeys.TRANSACTIONAL),
            {
                type: "promise",
                metadata: metadata.length ? metadata : undefined
            } as TransactionalMetadata,
            target,
            propertyKey
        );

        const originalMethod = descriptor.value;

        const methodWrapper = function(this: any, ...args: any[]): Promise<any> {
            const self = this;
            return new Promise<any>((resolve, reject) => {

                const cb = (err: Err, result?: any) => {
                    Transaction.release(err).then(_ => {
                        if (err)
                            return reject(err)
                        resolve(result)
                    });
                }

                let transaction = args.shift();
                if (transaction instanceof Transaction){
                    const updatedTransaction: Transaction = new Transaction(this.constructor.name, propertyKey,  async () => {
                        originalMethod.call(updatedTransaction.bindToTransaction(self), ...args)
                            .then(resolve)
                            .catch(reject);
                    },  metadata.length ? metadata : undefined);

                    transaction.bindTransaction(updatedTransaction);
                    transaction.fire();
                } else {
                    args.unshift(transaction);
                    transaction = undefined;
                    transaction = new Transaction(this.constructor.name, propertyKey,   () => {
                        originalMethod.call(transaction.bindToTransaction(self), ...args)
                            .then((result: any) => cb(undefined, result))
                            .catch(cb);
                    },  metadata.length ? metadata : undefined);
                    Transaction.submit(transaction);
                }
            })
        }

        Object.defineProperty(methodWrapper, "name", {
            value: propertyKey
        })
        descriptor.value = methodWrapper;
    }
}

/**
 * @summary Sets a class Async method as transactional
 *
 * @param {any[]}  [metadata] option metadata available to the {@link TransactionLock}
 *
 * @function transactionalAsync
 *
 * @memberOf module:db-decorators.Decorators.transactions
 */
export function transactionalAsync(...metadata: any[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(
            getRepoKeyKey(RepositoryKeys.TRANSACTIONAL),
            {
                type: "async",
                metadata: metadata.length ? metadata : undefined
            } as TransactionalMetadata,
            target,
            propertyKey
        );

        const originalMethod = descriptor.value;

        const methodWrapper = function(this: any, ...args: any[]){
            let callback: Callback = args.pop();
            if (!callback || typeof callback !== 'function')
                throw new CriticalError(`Missing Callback`);

            const cb = (err?: Err, ...args: any[]) => {
                Transaction.release(err).then(_ => callback(err, ...args));
            }

            const self = this;

            let transaction = args.shift();
            if (transaction instanceof Transaction){
                const updatedTransaction: Transaction = new Transaction(this.constructor.name, propertyKey,  () => {
                    try {
                        return originalMethod.call(updatedTransaction.bindToTransaction(self), ...args, callback);
                    } catch (e: any) {
                        return callback(e)
                    }
                },  metadata.length ? metadata : undefined);

                transaction.bindTransaction(updatedTransaction);
                transaction.fire();
            } else {
                args.unshift(transaction);
                transaction = undefined;
                transaction = new Transaction(this.constructor.name, propertyKey,  () => {
                    try {
                        return originalMethod.call(transaction.bindToTransaction(self), ...args, cb);
                    } catch (e: any) {
                        return cb(e)
                    }
                },  metadata.length ? metadata : undefined);
                Transaction.submit(transaction);
            }
        }

        Object.defineProperty(methodWrapper, "name", {
            value: propertyKey
        })
        descriptor.value = methodWrapper;
    }
}

/**
 * @summary The types os supported functions by the transactional implementation
 *
 * @const FunctionType
 *
 * @property {string} CALLBACK
 * @property {string} PROMISE
 * @memberOf module:db-decorators.Transactions
 */
export enum FunctionType {
    CALLBACK = "callback",
    PROMISE = "promise"
}

/**
 * @summary Sets a class method as transactional
 *
 * @param {FunctionType} type
 * @param {any[]} [metadata] any metadata you want passed to the {@link  TransactionLock}
 *
 * @function transactional
 *
 * @memberOf module:db-decorators.Decorators.transactions
 */
export function transactional(type: FunctionType = FunctionType.CALLBACK, ...metadata: any[]){
    switch (type){
        case FunctionType.CALLBACK:
            return transactionalAsync(...metadata)
        case FunctionType.PROMISE:
            return transactionalPromise(...metadata)
    }
}

/**
 * @summary Util function to wrap super calls with the transaction when the super's method is also transactional
 *
 * @param {Function} method the super method (must be bound to the proper this), eg: super.create.bind(this)
 * @param {any[]} args the arguments to call the method with
 *
 * @memberOf module:db-decorators.Transaction
 */
export function transactionalSuperCall(method: Function, ...args: any){
    const lock = Transaction.getLock();
    const currentTransaction = lock.currentTransaction;
    method(currentTransaction, ...args)
}