import DBModel from "../src/model/DBModel";
import {AsyncRepositoryImp, Callback, DBErrors, DbKey, errorCallback, ModelCallback} from "../src";
// @ts-ignore
import {TestModelAsync} from "./TestModel";
import ModelErrorDefinition from "@tvenceslau/decorator-validation/lib/Model/ModelErrorDefinition";

export abstract class AsyncRamRepository<T extends DBModel> extends AsyncRepositoryImp<T> {
    private ram: {[indexer: string]: T} = {};

    constructor(clazz: {new(): T}) {
        super(clazz);
    }

    create(key: DbKey, model: T, callback: ModelCallback<T>): void {
        const self = this;
        self.read(model.id, (err, oldModel) => {
            if (!err)
                return errorCallback(new Error(DBErrors.EXISTS), callback);

            const errors: ModelErrorDefinition | undefined = model.hasErrors();
            if (errors)
                return errorCallback(errors.toString(), callback);

            self.ram[model.id] = model;
            callback(undefined, model);
        });
    }

    delete(key: DbKey, callback: Callback): void {
        const self = this;
        self.read(key, (err, oldModel) => {
            if (err)
                return errorCallback(new Error(DBErrors.MISSING), callback);
            delete self.ram[key];
            callback()
        });
    }

    read(key: DbKey, callback: ModelCallback<T>): void {
        if (!(key in this.ram))
            return callback(new Error(DBErrors.MISSING));
        callback(undefined, this.ram[key]);
    }

    update(key: DbKey, model: T, callback: ModelCallback<T>): void {
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
                return errorCallback(err, callback);
            const errors: ModelErrorDefinition | undefined = model.hasErrors(oldModel);
            if (errors)
                return errorCallback(errors.toString(), callback);

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