import {constructFromObject, model} from "@decaf-ts/decorator-validation";
import {after, on, onCreate} from "../../src/operations/decorators";
import {DBOperations, OperationKeys} from "../../src/operations/constants";
import {DBModel} from "../../src/model/DBModel";
import {timestamp} from "../../src/validation/decorators";
import {IRepository} from "../../src/interfaces/IRepository";
import {RamRepository} from "./RamRepository";
import {InternalError} from "../../src/repository/errors";
import {Injectables} from "@decaf-ts/injectable-decorators";
import {id} from "../../src";

describe("Operations decorators", () => {
  describe("on", () => {

    beforeEach(() => {
      jest.clearAllMocks();
    })

    class Handler {

      static async handler(this: IRepository<DBModel>, data: any, key: string, model: DBModel) {
        (model as { [indexer: string]: any })[key as string] = "test";
      }

      static async otherHandler(this: IRepository<DBModel>, data: any, key: string, model: DBModel) {
        (model as { [indexer: string]: any })[key as string] = "test2";
      }

      static async yetAnotherHandler(this: IRepository<DBModel>, data: any, key: string, model: DBModel) {
        (model as { [indexer: string]: any })[key as string] = new Date();
      }

      static async argHandler(this: IRepository<DBModel>, data: { arg1: string, arg2: string }, key: string, model: DBModel) {
        (model as { [indexer: string]: any })[key as string] = data.arg1 + data.arg2;
      }

      static async anotherArgHandler(this: IRepository<DBModel>, data: number, key: string, model: DBModel) {
        const currentDate: Date | undefined = (model as { [indexer: string]: any })[key as string];
        if (!currentDate)
          throw new InternalError("date not provided");
        (model as { [indexer: string]: any })[key as string] = currentDate.setFullYear(currentDate.getFullYear() + data);
      }
    }

    class TestModelOn extends DBModel {

      @id()
      id?: string = undefined;

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

    class TestModelOnRepo extends RamRepository<TestModelOn> {
      constructor() {
        super(TestModelOn);
      }
    }

    it("calls handler on create", async () => {
      const tm = new TestModelOn({
        id: Date.now().toString()
      });
      const repo = new TestModelOnRepo();
      const model = await repo.create(tm);
      expect(model).toBeDefined();
      expect(model?.create).toEqual("test");
    })

    it("calls handler on read", async () => {

      const mock = jest.spyOn(Handler, "handler")

      class TestModelOnRead extends DBModel {

        @id()
        id?: string = undefined;

        @on([OperationKeys.READ], Handler.handler)
        read?: string = undefined;

        constructor(tm?: TestModelOn | {}) {
          super();
          constructFromObject(this, tm)
        }
      }

      class TestModelOnReadRepo extends RamRepository<TestModelOnRead> {
        constructor() {
          super(TestModelOnRead);
        }
      }

      const tm = new TestModelOnRead({
        id: Date.now().toString()
      });

      const repo = new TestModelOnReadRepo();

      const model = await repo.create(tm);
      expect(model).toBeDefined();

      const newModel = await repo.read(model.id as string);
      expect(newModel).toBeDefined();

      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledWith(undefined, "read", expect.objectContaining({"id": undefined, "read": "test"}));
    })

    it("calls handler on update", async () => {
      const tm = new TestModelOn({
        id: Date.now().toString()
      });

      const repo = new TestModelOnRepo();

      const model = await repo.create(tm)
      expect(model).toBeDefined();
      expect(model?.create).toEqual("test");

      const newModel = await repo.update(model);
      expect(newModel).toBeDefined();
      expect(newModel?.create).toEqual("test");
      expect(newModel?.update).toEqual("test");
    })

    it("calls multiple handlers", async () => {

      const mock: any = jest.spyOn(Handler, "handler")
      Object.defineProperty(mock, "name", {value: "mock"});                          // making sure the function names are different since the hash will be the same

      const otherMock: any = jest.spyOn(Handler, "otherHandler");
      Object.defineProperty(otherMock, "name", {value: "otherMock"});                          // making sure the function names are different since the hash will be the same

      class TestModelMultiple extends DBModel {
        @id()
        id?: string = undefined;

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

      class TestModelMultipleRepo extends RamRepository<TestModelMultiple> {
        constructor() {
          super(TestModelMultiple);
        }
      }

      const tm = new TestModelMultiple({
        id: Date.now().toString()
      });

      const repo = new TestModelMultipleRepo();

      const model = await repo.create(tm)
      expect(model).toBeDefined();

      expect(otherMock).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(model?.create).toEqual("test2")
      expect(model?.timestamp).toBeDefined()
    })

    it("Handles property overrides", async () => {

      const mock: any = jest.spyOn(Handler, "yetAnotherHandler")

      class BaseModel extends DBModel {
        @id()
        id?: string = undefined;

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
      class OtherBaseModel extends OverriddenBaseModel {
        constructor(otherBaseModel?: OtherBaseModel | {}) {
          super(otherBaseModel);
        }
      }

      class BaseModelRepo extends RamRepository<BaseModel> {
        constructor() {
          super(BaseModel);
        }
      }

      class OverriddenBaseModelRepo extends RamRepository<OverriddenBaseModel> {
        constructor() {
          super(OverriddenBaseModel);
        }
      }

      class OtherBaseModelRepo extends RamRepository<OtherBaseModel> {
        constructor() {
          super(OtherBaseModel);
        }
      }

      const tm = new BaseModel({
        id: Date.now().toString()
      });

      const repo = new BaseModelRepo();

      const baseModel = await repo.create(tm)

      expect(baseModel).toBeDefined();
      expect(mock).toHaveBeenCalledTimes(0);
      expect(baseModel?.updatedOn).toBeDefined()

      const tm2 = new OverriddenBaseModel({
        id: Date.now().toString()
      });
      const repo2 = new OverriddenBaseModelRepo();
      await repo2.create(tm2)
      expect(mock).toHaveBeenCalledTimes(1);

      const tm3 = new OtherBaseModel({
        id: Date.now().toString()
      });
      const repo3 = new OtherBaseModelRepo();
      await repo3.create(tm3)
      expect(mock).toHaveBeenCalledTimes(2);
    })

    it("Handles property overrides in the correct order", async () => {

      const mock = jest.spyOn(Handler, "anotherArgHandler");
      const yearDiff = 1;

      class OrderBaseModel extends DBModel {
        @id()
        id?: string = undefined;

        @timestamp()
        updatedOn?: Date = undefined;

        constructor(baseModel?: OrderBaseModel | {}) {
          super();
          constructFromObject<OrderBaseModel>(this, baseModel);
        }
      }

      class OverriddenOrderBaseModel extends OrderBaseModel {
        @onCreate(Handler.anotherArgHandler, yearDiff)
        override updatedOn?: Date = undefined;

        constructor(overriddenOrderBaseModel?: OverriddenOrderBaseModel | {}) {
          super(overriddenOrderBaseModel);
          constructFromObject<OverriddenOrderBaseModel>(this, overriddenOrderBaseModel);
        }

      }

      class BaseModelRepo extends RamRepository<OrderBaseModel> {
        constructor() {
          super(OrderBaseModel);
        }
      }

      class OverriddenOrderBaseModelRepo extends RamRepository<OverriddenOrderBaseModel> {
        constructor() {
          super(OverriddenOrderBaseModel);
        }
      }

      const tm = new OrderBaseModel({
        id: Date.now().toString()
      });

      const repo = new BaseModelRepo();

      const baseModel = await repo.create(tm)
      expect(baseModel).toBeDefined();
      expect(mock).toHaveBeenCalledTimes(0);
      expect(baseModel?.updatedOn).toBeDefined()

      let compareYear: number = (new Date()).getFullYear();

      expect((baseModel?.updatedOn as Date).getFullYear()).toEqual(compareYear)

      const tm2 = new OverriddenOrderBaseModel({
        id: Date.now().toString()
      });

      const repo2 = new OverriddenOrderBaseModelRepo();

      const overModel = await repo2.create(tm2)
      expect(overModel).toBeDefined();
      expect(mock).toHaveBeenCalledTimes(1);
      expect(overModel?.updatedOn).toBeDefined()

      compareYear = (new Date()).getFullYear() + yearDiff;

      expect((overModel?.updatedOn as Date).getFullYear()).toEqual(compareYear)
    })

    describe("Properly passes arguments to handler function", () => {

      beforeEach(() => {
        Injectables.reset();
        jest.clearAllMocks();
      })

      it("Properly fills the key as the propertyKey", async () => {
        const mock: any = jest.spyOn(Handler, "handler")

        class TestModelKey extends DBModel {
          @id()
          id?: string = undefined;
          @on(DBOperations.CREATE, Handler.handler)
          onCreate?: string = undefined;

          constructor(tm?: TestModelKey | {}) {
            super();
            constructFromObject(this, tm)
          }
        }

        class TestModelKeyRepo extends RamRepository<TestModelKey> {
          constructor() {
            super(TestModelKey);
          }
        }

        const tm = new TestModelKey({
          id: Date.now().toString()
        });
        const repo = new TestModelKeyRepo();

        const model = await repo.create(tm)
        expect(model).toBeDefined();
        expect(mock).toHaveBeenCalledTimes(1);
        expect(model?.onCreate).toEqual("test")
      })

      it("Properly passes arguments", async () => {
        const mock: any = jest.spyOn(Handler, "argHandler")
        const arg1 = "this is an arg";
        const arg2 = "this is an arg too";

        class TestModelArguments extends DBModel {
          @id()
          id?: string = undefined;
          @on(DBOperations.CREATE, Handler.argHandler, {arg1: arg1, arg2: arg2})
          onCreate?: string = undefined;

          constructor(tm?: TestModelArguments | {}) {
            super();
            constructFromObject(this, tm)
          }
        }

        class TestModelKeyRepo extends RamRepository<TestModelArguments> {
          constructor() {
            super(TestModelArguments);
          }
        }

        const tm = new TestModelArguments({
          id: Date.now().toString()
        });
        const repo = new TestModelKeyRepo();

        const model = await repo.create(tm);
        expect(model).toBeDefined();
        expect(mock).toHaveBeenCalledTimes(1);
        expect(model?.onCreate).toEqual(arg1 + arg2)
      })
    })

  })
})