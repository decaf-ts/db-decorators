import {Constructor, ModelErrorDefinition} from "@glass-project1/decorator-validation";
import type {Callback, Err} from "@glass-project1/logging";
import {all, CriticalError, debugCallback, errorCallback, info, LoggedError} from "@glass-project1/logging";
// @ts-ignore
import {InheritanceTestModel, TestModelAsync} from "./TestModel";
import {
    AsyncRepositoryImp,
    DBErrors,
    DBModel, FunctionType,
    repository,
    transactional, transactionalSuperCall, AsyncRepository, ModelOrCallback, Transactional
} from "../../src";
import type {ModelCallback} from "../../src";

export function managerCallIterator<T extends DBModel>(this: AsyncRepository<T>, func: Function, ...args: (any | Callback)[]) {
    if (!args || args.length < 1)
        throw new LoggedError("Needs at least a callback");
    const callback: Callback = args.pop();

    if (!args.every(a => Array.isArray(a) && a.length === args[0].length))
        return callback(`Invalid argument length`);

    const self = this;

    const iterator = function (accum: T[], ...argz: any[]) {
        const callback: Callback = argz.pop();
        const callArgs = argz.map(a => a.shift()).filter(a => !!a);

        if (!callArgs.length)
            return callback(undefined, accum);

        try {
            func.call(self, ...callArgs, (err: Err, results: T) => {
                if (err)
                    return debugCallback.call(self, err, callback);
                accum.push(results);
                iterator(accum, ...argz, callback);
            });
        } catch (e) {
            return debugCallback.call(self, e as Error, callback);
        }
    }

    iterator([], ...args, (err: Err, results: any[]) => {
        err ? callback(err) : callback(undefined, results)
    });
}

export class AsyncRamRepository<T extends DBModel> extends AsyncRepositoryImp<T> {
    protected ram: { [indexer: string]: T } = {};

    constructor(clazz: Constructor<T>) {
        super(clazz);
        this.ram = {};
    }

    @transactional()
    create(key: any, model: T, callback: ModelCallback<T>): void {
        const self = this;
        self.read(key, (err, oldModel) => {
            if (!err)
                return callback(new Error(DBErrors.EXISTS));

            const errors: ModelErrorDefinition | undefined = model.hasErrors();
            if (errors)
                return callback(errors.toString());

            self.ram[key] = model;
            callback(undefined, model);
        });
    }

    @transactional()
    delete(key: any, callback: Callback): void {
        const self = this;
        self.read(key, (err, oldModel) => {
            if (err)
                return callback(new Error(DBErrors.MISSING));
            delete self.ram[key];
            callback()
        });
    }

    read(key: any, callback: ModelCallback<T>): void {
        if (!this.ram)
            return callback(new CriticalError("Should not be possible"));
        if (!(key in this.ram))
            return callback(new Error(DBErrors.MISSING));
        callback(undefined, this.ram[key]);
    }

    @transactional()
    update(key: any, model: T, callback: ModelCallback<T>): void {
        if (!callback) {
            // @ts-ignore
            callback = model as ModelCallback<T>;
            model = key as T;
            key = model.id;
        }
        if (!model)
            return callback(new Error(`Missing model`));

        const self = this;
        self.read(key, (err, oldModel) => {
            if (err)
                return callback(err);
            const errors: ModelErrorDefinition | undefined = model.hasErrors(oldModel);
            if (errors)
                return callback(errors.toString());

            self.ram[model.id] = model;
            callback(undefined, model);
        });
    }
}
@Transactional()
export class DBMock<T extends DBModel> implements AsyncRepository<T>{

    private cache: {[indexer : string]: any} = {}

    constructor(private timeout = 200) {
    }

    @transactional()
    create(key: any, model: T, callback: Callback): void {
        const self = this;
        setTimeout(() => {
            if (key in self.cache)
                return errorCallback("Record with key {0} already exists",  callback, key)
            self.cache[key] = model;
            callback(undefined, model)
        }, self.timeout)
    }

    read(key: any, callback: Callback): void {
        const self = this;
        setTimeout(() => {
            if (!(key in self.cache))
                return errorCallback("Record with key {0} does not exist",  callback, key)
            callback(undefined, self.cache[key])
        }, self.timeout/4)
    }

    @transactional()
    update(key: any, model: T, callback: Callback): void {
        const self = this;
        setTimeout(() => {
            if (key in self.cache)
                return errorCallback("Record with key {0} does not exist",  callback, key)
            self.cache[key] = model;
            callback(undefined, model)
        }, self.timeout)
    }

    @transactional()
    delete(key: any, callback: Callback): void {
        const self = this;
        setTimeout(() => {
            if (!(key in self.cache))
                return errorCallback("Record with key {0} not found to delete", callback, key)
            delete self.cache[key];
            callback()
        }, self.timeout)
    }
}

@repository("DBRepo")
export class DBRepo<T extends DBModel> extends AsyncRepositoryImp<T>{

    private db = new DBMock()

    constructor(clazz: { new(): T }) {
        super(clazz);
    }

    @transactional()
    create(key: any, model: T, callback: Callback) {
        this.db.create(key, model, callback)
    }

    @transactional()
    delete(key: any,  callback: Callback) {
        this.db.delete(key, callback)
    }

    read(key: any, callback: Callback) {
        this.db.read(key, callback)
    }

    @transactional()
    update(key: any, model: T, callback: Callback) {
        this.db.update(key, model, callback)
    }

    @transactional()
    createAll(...args: (any | Callback)[]): void {
        let callback: Callback = args.pop();
        if (!callback)
            throw new CriticalError("No callback", this);
        const self = this;
        all.call(self, "Trying to create {1} records under the {0} table", "generic", args[0].length);

        managerCallIterator.call(this as any, this.create.bind(this), ...args, (err: Err, models: T[]) => {
            if (err || !models || !models.length)
                return debugCallback.call(self, err || "Could not create records", callback);
            all.call(self, "{1} records created under the {0} table", "generic", models.length);
            callback(undefined, models);
        });
    }
}

@repository()
export class TestRamRepository extends AsyncRamRepository<TestModelAsync>{
    constructor() {
        super(TestModelAsync);
    }
}

@repository()
export class InheritanceRamRepository extends AsyncRamRepository<InheritanceTestModel>{
    constructor() {
        super(InheritanceTestModel);
    }
}

@repository()
export class KeylessTestRamRepository extends AsyncRamRepository<TestModelAsync>{
    constructor() {
        super(TestModelAsync);
    }

    @transactional()
    // @ts-ignore
    create(model: TestModelAsync, callback: ModelCallback<TestModelAsync>){
        transactionalSuperCall(super.create.bind(this), undefined, model, callback)
    }

    protected createPrefix(model?: TestModelAsync, ...args: any[]) {
        super.createPrefix(undefined, model, ...args);
    }
}


@repository()
export class TransactionalRepository extends AsyncRamRepository<TestModelAsync>{
    private readonly timeout: number;
    private readonly isRandom: boolean;

    constructor(timeout: number, isRandom: boolean = false) {
        super(TestModelAsync);
        this.timeout = timeout;
        this.isRandom = isRandom;
    }

    private getTimeout(){
        return !this.isRandom ? this.timeout : Math.floor(Math.random() * this.timeout)
    }

    @transactional()
    create(key: any, model: TestModelAsync, callback: ModelCallback<TestModelAsync>) : void{
        const self = this;
        transactionalSuperCall(super.create.bind(this), key, model, (...args: any[]) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactional()
    delete(key: any, callback: Callback) {
        const self = this;
        transactionalSuperCall(super.delete.bind(this), key, (...args: any[]) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    read(key: any, callback: ModelCallback<TestModelAsync>) {
        const self = this;
        super.read(key, (...args) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactional()
    update(key: any, model: TestModelAsync, callback: ModelCallback<TestModelAsync>) {
        const self = this;
        transactionalSuperCall(super.update.bind(this), key, model, (...args: any[]) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }
}


@repository()
export class OtherTransactionalRepository extends AsyncRamRepository<TestModelAsync>{
    private readonly timeout: number;
    private readonly isRandom: boolean;

    constructor(timeout: number, isRandom: boolean = false) {
        super(TestModelAsync);
        this.timeout = timeout;
        this.isRandom = isRandom;
    }

    private getTimeout(){
        return !this.isRandom ? this.timeout : Math.floor(Math.random() * this.timeout)
    }

    @transactional()
    create(key: any, model: TestModelAsync, callback: ModelCallback<TestModelAsync>) : void{
        const self = this;
        transactionalSuperCall(super.create.bind(this), key, model, (...args: any[]) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactional()
    delete(key: any, callback: Callback) {
        const self = this;
        transactionalSuperCall(super.delete.bind(this), key, (...args: any[]) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    read(key: any, callback: ModelCallback<TestModelAsync>) {
        const self = this;
        super.read(key, (...args) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactional()
    update(key: any, model: TestModelAsync, callback: ModelCallback<TestModelAsync>) {
        const self = this;
        transactionalSuperCall(super.update.bind(this), key, model, (...args: any[]) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }
}

// @Transactional()
export class GenericCaller {

    private repo1: TransactionalRepository = new TransactionalRepository(200, false)

    private repo2: OtherTransactionalRepository = new OtherTransactionalRepository(300, true)

    @transactional()
    runAsync(model: TestModelAsync, callback: Callback){
        const self = this;
        self.repo1.create(Date.now(), model, (err, created1) => {
            if (err || !created1)
                return errorCallback.call(self, "Failed to create first model: {0}", callback, err || "Missing result")
            info.call(self, "Created first model")
            self.repo2.create(created1.id, created1, (err, created2) => {
                if (err || !created2)
                    return errorCallback.call(self, "Failed to create second model: {0}", callback, err || "Missing result")
                info.call(self, "Created second model")
                callback(undefined, created1, created2)
            })
        })
    }

    @transactional(FunctionType.PROMISE)
    async runPromise(model: TestModelAsync){
        const self = this;
        return new Promise<{model1: TestModelAsync, model2: TestModelAsync}>((resolve, reject) => {
            self.runAsync(model, (err: Err, model1?: TestModelAsync, model2?: TestModelAsync) => {
                if (err || !model1 || !model2)
                    return reject(err || "Missing results")
                resolve({
                    model1: model1,
                    model2: model2
                })
            })
        })
    }
}