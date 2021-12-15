import DBModel from "../src/model/DBModel";
import {DBOperations, timestamp, id, IGeneratorAsync, Callback, readonly} from "../src";
import {constructFromObject, minlength} from "@tvenceslau/decorator-validation/lib";

export class TimeStampGeneratorAsync<T extends DBModel> implements IGeneratorAsync<T> {
    generate(model: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        const result = Date.now();
        callback(undefined, result);
    }
}

export class TestModelAsync extends DBModel {

    @id<TestModelAsync>(TimeStampGeneratorAsync)
    id?: string | number = undefined;

    @readonly()
    name?: string = undefined;

    @minlength(5)
    address?: string = undefined;

    @timestamp()
    updatedOn?: Date = undefined;

    @timestamp(DBOperations.CREATE)
    @readonly()
    createdOn?: Date = undefined;

    public constructor(testModel?: TestModelAsync | {}){
        super();
        constructFromObject(this, testModel);
    }
}