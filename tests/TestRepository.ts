import DBModel from "../src/model/DBModel";
import {AsyncRepositoryImp, Callback, DBErrors, ModelCallback} from "../src";
// @ts-ignore
import {TestModelAsync} from "./TestModel";
import ModelErrorDefinition from "@tvenceslau/decorator-validation/lib/Model/ModelErrorDefinition";

export abstract class AsyncRamRepository<T extends DBModel> extends AsyncRepositoryImp<T> {
    private ram: {[indexer: string]: T} = {};

    constructor(clazz: {new(): T}) {
        super(clazz);
    }

    create(key: any, model: T, callback: ModelCallback<T>): void {
        const self = this;
        self.read(key, (err, oldModel) => {
            if (!err)
                return callback(new Error(DBErrors.EXISTS));

            const errors: ModelErrorDefinition | undefined = model.hasErrors();
            if (errors)
                return callback(errors.toString());

            self.ram[model.id] = model;
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
        if (!(key in this.ram))
            return callback(new Error(DBErrors.MISSING));
        callback(undefined, this.ram[key]);
    }

    update(key: any, model: T, callback: ModelCallback<T>): void {
        if (!callback){
            // @ts-ignore
            callback = model as ModelCallback<T>;
            // @ts-ignore
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

export class TestRamRepository extends AsyncRamRepository<TestModelAsync>{
    constructor() {
        super(TestModelAsync);
    }
}

export class KeylessTestRamRepository extends TestRamRepository{
    constructor() {
        super();
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