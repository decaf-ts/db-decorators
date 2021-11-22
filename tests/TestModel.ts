import DBModel from "../src/model/DBModel";
import {DBOperations, timestamp, id, IGeneratorAsync, Callback, constructFromObject, readonly} from "../src";

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