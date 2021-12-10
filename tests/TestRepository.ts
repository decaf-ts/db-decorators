import DBModel from "../src/model/DBModel";
import {AsyncRepositoryImp, Callback, CriticalError, DBErrors, ModelCallback} from "../src";
// @ts-ignore
import {TestModelAsync} from "./TestModel";
import ModelErrorDefinition from "@tvenceslau/decorator-validation/lib/Model/ModelErrorDefinition";
import {repository} from "../src/repository/decorators";
import {transactionalAsync} from "../src/repository/transactions";
import {logAsync} from "../src/logging/decorators";

export abstract class AsyncRamRepository<T extends DBModel> extends AsyncRepositoryImp<T> {
    private ram: {[indexer: string]: T} = {};

    constructor(clazz: {new(): T}) {
        super(clazz);
        this.ram = {};
    }

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

    update(key: any, model: T, callback: ModelCallback<T>): void {
        if (!callback){
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

@repository()
export class TestRamRepository extends AsyncRamRepository<TestModelAsync>{
    constructor() {
        super(TestModelAsync);
    }
}

@repository()
export class KeylessTestRamRepository extends AsyncRamRepository<TestModelAsync>{
    constructor() {
        super(TestModelAsync);
    }

    // @ts-ignore
    create(model: TestModelAsync, callback: ModelCallback<TestModelAsync>){
        // @ts-ignore
        super.create(undefined, model, callback);
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

    @transactionalAsync()
    @logAsync(true)
    create(key: any, model: TestModelAsync, callback: ModelCallback<TestModelAsync>) : void{
        const self = this;
        super.create(key, model, (...args) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactionalAsync()
    @logAsync(true)
    delete(key: any, callback: Callback) {
        const self = this;
        super.delete(key, (...args) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactionalAsync()
    @logAsync(true)
    read(key: any, callback: ModelCallback<TestModelAsync>) {
        const self = this;
        super.read(key, (...args) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }

    @transactionalAsync()
    @logAsync(true)
    update(key: any, model: TestModelAsync, callback: ModelCallback<TestModelAsync>) {
        const self = this;
        super.update(key, model, (...args) => {
            setTimeout(() => {
                callback(...args)
            }, self.getTimeout())
        });
    }
}