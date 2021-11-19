import DBModel from "../src/model/DBModel";
import {DBOperations, timestamp, id, IGeneratorAsync, Callback, constructFromObject} from "../src";

export class TimeStampGeneratorAsync<T extends DBModel> implements IGeneratorAsync<T> {
    generate(model: T, ...args: any[]): void {
        const callback: Callback = args.pop();
        const result = Date.now();
        callback(undefined, result);
    }
}

export class TestModelAsync extends DBModel {

    @id<TestModelAsync>(TimeStampGeneratorAsync)
    id?: string = undefined;

    @timestamp()
    updatedOn?: string = undefined;

    @timestamp(DBOperations.CREATE)
    createdOn?: string = undefined;

    public constructor(testModel?: TestModelAsync | {}){
        super(testModel);
        constructFromObject(this, testModel);
    }
}