import {
    after,
    AsyncRepository,
    DBModel,
    DBOperations,
    ModelCallback,
    on, onCreate,
    OperationHandlerAsync,
    OperationKeys, readonly, timestamp
} from "../../src";
import {constructFromObject, model} from "@glass-project1/decorator-validation";
// @ts-ignore
import {AsyncRamRepository} from "./TestRepository";
import type {Err} from "@glass-project1/logging";
import {CriticalError, errorCallback} from "@glass-project1/logging";

describe("Operations decorators", () => {
    describe("on", () => {

        beforeEach(() => {
            jest.clearAllMocks();
        })

        class Handler {

            static handler: OperationHandlerAsync<DBModel> = function (this: AsyncRepository<DBModel>, key: string, model: DBModel, callback: ModelCallback<DBModel>) {
                (model as { [indexer: string]: any })[key as string] = "test";
                callback(undefined, model as DBModel);
            }

            static otherHandler: OperationHandlerAsync<any> = function (this: AsyncRepository<DBModel>, key: string, model: DBModel, callback: ModelCallback<DBModel>) {
                (model as {[indexer: string]: any})[key as string] = "test2";
                callback(undefined, model as any);
            }

            static yetAnotherHandler: OperationHandlerAsync<any> = function (this: AsyncRepository<DBModel>, key: string, model: DBModel, callback: ModelCallback<DBModel>) {
                (model as {[indexer: string]: any})[key as string] = new Date();
                callback(undefined, model as any);
            }

            static argHandler: OperationHandlerAsync<any> = function (this: AsyncRepository<DBModel>, key: string, model: DBModel, arg1: string, arg2: string, callback: ModelCallback<DBModel>) {
                (model as {[indexer: string]: any})[key as string] = arg1 + arg2;
                callback(undefined, model as any);
            }

            static anotherArgHandler: OperationHandlerAsync<any> = function (this: AsyncRepository<DBModel>, key: string, model: DBModel, arg1: number, callback: ModelCallback<DBModel>) {
                const currentDate: Date | undefined = (model as {[indexer: string]: any})[key as string];
                if (!currentDate)
                    return errorCallback.call(this, "date not provided", callback);
                (model as {[indexer: string]: any})[key as string] = currentDate.setFullYear(currentDate.getFullYear() + arg1);
                callback(undefined, model as any);
            }
        }

        class TestModelOn extends DBModel {

            @on(DBOperations.CREATE, Handler.handler)
            create?: string = undefined;

            @on(DBOperations.UPDATE, Handler.handler)
            update?: string = undefined;

            @after([OperationKeys.READ], Handler.handler)
            read?: string = undefined;

            @on(DBOperations.DELETE, Handler.handler)
            delete?: string = undefined;

            constructor(tm?: TestModelOn | {}) {
                super();
                constructFromObject(this, tm)
            }
        }

        class TestModelOnRepo extends AsyncRamRepository<TestModelOn>{
            constructor() {
                super(TestModelOn);
            }
        }

        it("calls handler on create", (callback) => {
            const tm = new TestModelOn();

            const repo = new TestModelOnRepo();

            repo.create("key", tm, (err: Err, model?: TestModelOn) => {
                expect(err).toBeUndefined();
                expect(model).toBeDefined();
                expect(model?.create).toEqual("test");
                callback()
            })
        })

        it("calls handler on read", (callback) => {

            const mock = jest.spyOn(Handler, "handler")

            class TestModelOnRead extends DBModel {
                @on([OperationKeys.READ], Handler.handler)
                read?: string = undefined;

                constructor(tm?: TestModelOn | {}) {
                    super();
                    constructFromObject(this, tm)
                }
            }

            class TestModelOnReadRepo extends AsyncRamRepository<TestModelOnRead>{
                constructor() {
                    super(TestModelOnRead);
                }
            }

            const tm = new TestModelOnRead();

            const repo = new TestModelOnReadRepo();

            repo.create("key", tm, (err: Err, model?: TestModelOn) => {
                expect(err).toBeUndefined();
                expect(model).toBeDefined();

                repo.read("key",  (err: Err, newModel?: TestModelOn) => {
                    expect(err).toBeUndefined();
                    expect(newModel).toBeDefined();

                    expect(mock).toHaveBeenCalledTimes(2);
                    expect(mock).toHaveBeenCalledWith("read", expect.objectContaining({"read": "test"}), expect.any(Function));
                    callback()
                })
            })
        })

        it("calls handler on update", (callback) => {
            const tm = new TestModelOn();

            const repo = new TestModelOnRepo();

            repo.create("key", tm, (err: Err, model?: TestModelOn) => {
                expect(err).toBeUndefined();
                expect(model).toBeDefined();
                expect(model?.create).toEqual("test");

                repo.update("key", model as TestModelOn, (err: Err, newModel?: TestModelOn) => {
                    expect(err).toBeUndefined();
                    expect(newModel).toBeDefined();
                    expect(model?.create).toEqual("test");
                    expect(model?.read).toEqual("test");
                    expect(model?.update).toEqual("test");
                    callback()
                })
            })
        })

        it("calls multiple handlers", (callback) => {

            const mock: any = jest.spyOn(Handler, "handler")
            Object.defineProperty(mock, "name", {value: "mock"});                          // making sure the function names are different since the hash will be the same

            const otherMock: any = jest.spyOn(Handler, "otherHandler");
            Object.defineProperty(otherMock, "name", {value: "otherMock"});                          // making sure the function names are different since the hash will be the same

            class TestModelMultiple extends DBModel {
                @onCreate(Handler.otherHandler)
                @onCreate(Handler.handler)
                create?: string = undefined;

                @timestamp(DBOperations.CREATE_UPDATE)
                timestamp?: Date | string = undefined;

                constructor(tm?: TestModelOn | {}) {
                    super();
                    constructFromObject(this, tm)
                }
            }

            class TestModelMultipleRepo extends AsyncRamRepository<TestModelMultiple>{
                constructor() {
                    super(TestModelMultiple);
                }
            }

            const tm = new TestModelMultiple();

            const repo = new TestModelMultipleRepo();

            repo.create("key", tm, (err: Err, model?: TestModelMultiple) => {
                expect(err).toBeUndefined();
                expect(model).toBeDefined();

                expect(otherMock).toHaveBeenCalledTimes(1);
                expect(mock).toHaveBeenCalledTimes(1);
                expect(model?.create).toEqual("test2")
                expect(model?.timestamp).toBeDefined()
                callback()
            })

        })

        it("Handles property overrides", (callback) => {

            const mock: any = jest.spyOn(Handler, "yetAnotherHandler")

            class BaseModel extends DBModel {

                @timestamp()
                updatedOn?: Date | string = undefined;

                constructor(baseModel?: BaseModel | {}) {
                    super();
                    constructFromObject<BaseModel>(this, baseModel);
                }
            }

            class OverriddenBaseModel extends BaseModel {
                @onCreate(Handler.yetAnotherHandler)
                override updatedOn?: Date | string = undefined;

                constructor(immutableSignedBaseModel?: OverriddenBaseModel | {}) {
                    super(immutableSignedBaseModel);
                    constructFromObject<OverriddenBaseModel>(this, immutableSignedBaseModel);
                }

            }

            @model()
            class OtherBaseModel extends OverriddenBaseModel{
                constructor(otherBaseModel?: OtherBaseModel | {}) {
                    super(otherBaseModel);
                }
            }

            class BaseModelRepo extends AsyncRamRepository<BaseModel>{
                constructor() {
                    super(BaseModel);
                }
            }

            class OverriddenBaseModelRepo extends AsyncRamRepository<OverriddenBaseModel>{
                constructor() {
                    super(OverriddenBaseModel);
                }
            }

            class OtherBaseModelRepo extends AsyncRamRepository<OtherBaseModel>{
                constructor() {
                    super(OtherBaseModel);
                }
            }

            const tm = new BaseModel();

            const repo = new BaseModelRepo();

            repo.create("key", tm, (err: Err, baseModel?: BaseModel) => {
                try {
                    expect(err).toBeUndefined();
                    expect(baseModel).toBeDefined();
                    expect(mock).toHaveBeenCalledTimes(0);
                    expect(baseModel?.updatedOn).toBeDefined()
                } catch (e: any) {
                    return callback(e)
                }

                const tm2 = new OverriddenBaseModel();

                const repo2 = new OverriddenBaseModelRepo();

                repo2.create("key", tm2, (err: Err) => {

                    try {
                        expect(err).toBeUndefined()
                        expect(mock).toHaveBeenCalledTimes(1);
                    } catch (e: any) {
                        return callback(e)
                    }

                    const tm3 = new OtherBaseModel();

                    const repo3 = new OtherBaseModelRepo();

                    repo3.create("key", tm3, (err: Err) => {
                        try {
                            expect(err).toBeUndefined();
                            expect(mock).toHaveBeenCalledTimes(2);
                        } catch (e: any) {
                            return callback(e)
                        }

                        callback()
                    });
                })
            })
        })

        it("Handles property overrides in the correct order", (callback) => {

            const mock = jest.spyOn(Handler, "anotherArgHandler");
            const yearDiff = 1;

            class OrderBaseModel extends DBModel {

                @timestamp()
                updatedOn?: Date | string = undefined;

                constructor(baseModel?: OrderBaseModel | {}) {
                    super();
                    constructFromObject<OrderBaseModel>(this, baseModel);
                }
            }

            class OverriddenOrderBaseModel extends OrderBaseModel {
                @onCreate(Handler.anotherArgHandler, yearDiff)
                override updatedOn?: Date | string = undefined;

                constructor(overriddenOrderBaseModel?: OverriddenOrderBaseModel | {}) {
                    super(overriddenOrderBaseModel);
                    constructFromObject<OverriddenOrderBaseModel>(this, overriddenOrderBaseModel);
                }

            }

            class BaseModelRepo extends AsyncRamRepository<OrderBaseModel>{
                constructor() {
                    super(OrderBaseModel);
                }
            }

            class OverriddenBaseModelRepo extends AsyncRamRepository<OverriddenOrderBaseModel>{
                constructor() {
                    super(OverriddenOrderBaseModel);
                }
            }

            const tm = new OrderBaseModel();

            const repo = new BaseModelRepo();

            repo.create("key", tm, (err: Err, baseModel?: OrderBaseModel) => {
                expect(err).toBeUndefined();
                expect(baseModel).toBeDefined();
                expect(mock).toHaveBeenCalledTimes(0);
                expect(baseModel?.updatedOn).toBeDefined()

                let compareYear: number = (new Date()).getFullYear();

                expect((baseModel?.updatedOn as Date).getFullYear()).toEqual(compareYear)

                const tm2 = new OverriddenOrderBaseModel();

                const repo2 = new OverriddenBaseModelRepo();

                repo2.create("key", tm2, (err: Err, overModel?: OverriddenOrderBaseModel) => {
                    expect(err).toBeUndefined()
                    expect(overModel).toBeDefined();
                    expect(mock).toHaveBeenCalledTimes(1);
                    expect(overModel?.updatedOn).toBeDefined()

                    compareYear = (new Date()).getFullYear() + yearDiff;

                    expect((overModel?.updatedOn as Date).getFullYear()).toEqual(compareYear)
                    callback()
                })
            })
        })

        describe("Properly passes arguments to handler function", () => {

            beforeEach(() => {
                jest.clearAllMocks();
            })

            it("Properly fills the key as the propertyKey", (callback) => {
                const mock: any = jest.spyOn(Handler, "handler")

                class TestModelKey extends DBModel {
                    @on(DBOperations.CREATE, Handler.handler)
                    onCreate?: string = undefined;

                    constructor(tm?: TestModelKey | {}) {
                        super();
                        constructFromObject(this, tm)
                    }
                }

                class TestModelKeyRepo extends AsyncRamRepository<TestModelKey>{
                    constructor() {
                        super(TestModelKey);
                    }
                }

                const tm = new TestModelKey();
                const repo = new TestModelKeyRepo();

                repo.create("anyKey", tm, (err: Err, model?: TestModelKey) => {
                    expect(err).toBeUndefined();
                    expect(model).toBeDefined();
                    expect(mock).toHaveBeenCalledTimes(1);
                    expect(mock).toHaveBeenCalledWith("onCreate", tm, expect.any(Function));
                    expect(model?.onCreate).toEqual("test")
                    callback()
                })
            })

            it("Properly passes arguments", (callback) => {
                const mock: any = jest.spyOn(Handler, "argHandler")
                const arg1 = "this is an arg";
                const arg2 = "this is an arg too";

                class TestModelArguments extends DBModel {
                    @on(DBOperations.CREATE, Handler.argHandler, arg1, arg2)
                    onCreate?: string = undefined;

                    constructor(tm?: TestModelArguments | {}) {
                        super();
                        constructFromObject(this, tm)
                    }
                }

                class TestModelKeyRepo extends AsyncRamRepository<TestModelArguments>{
                    constructor() {
                        super(TestModelArguments);
                    }
                }

                const tm = new TestModelArguments();
                const repo = new TestModelKeyRepo();

                repo.create("anyKey", tm, (err: Err, model?: TestModelArguments) => {
                    expect(err).toBeUndefined();
                    expect(model).toBeDefined();
                    expect(mock).toHaveBeenCalledTimes(1);
                    expect(mock).toHaveBeenCalledWith("onCreate", tm, arg1, arg2, expect.any(Function));
                    expect(model?.onCreate).toEqual(arg1 + arg2)
                    callback()
                })
            })

        })
    })

})