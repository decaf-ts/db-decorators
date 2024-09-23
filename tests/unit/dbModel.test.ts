// @ts-ignore
import {TestModelAsync} from "./TestModel";
import {Repository, DBModel} from "../../src";
import {
  constructFromModel,
  list,
  minlength,
  model,
  ModelArg, ModelErrorDefinition,
  required,
  setModelBuilderFunction
} from "@decaf-ts/decorator-validation";
import {AsyncRamRepository} from "./TestRepository";
import {Err} from "@decaf-ts/logging";
import {readonly} from "../../src";

@model()
class InnerTestModel extends DBModel {

  @readonly()
  @required()
  value?: string = undefined;

  constructor(arg: ModelArg<InnerTestModel>) {
    super(arg);
  }


  hasErrors(previousVersion?: any, ...exclusions: any[]): ModelErrorDefinition | undefined {
    return super.hasErrors(previousVersion, ...exclusions);
  }
}

@model()
class OuterTestModel extends DBModel {

  @required()
  child?: InnerTestModel = undefined;

  constructor(arg: ModelArg<OuterTestModel>) {
    super(arg);
  }


  hasErrors(previousVersion?: any, ...exclusions: any[]): ModelErrorDefinition | undefined {
    return super.hasErrors(previousVersion, ...exclusions);
  }
}

@model()
class OuterListTestModel extends DBModel {

  @list(InnerTestModel)
  @minlength(1)
  @required()
  children?: InnerTestModel[] = undefined;

  constructor(arg: ModelArg<OuterTestModel>) {
    super(arg);
  }
}

describe(`DBModel Async`, function () {
  it(`Instantiates`, function () {
    const testModel = new TestModelAsync();
    expect(testModel).not.toBeNull();
  });

  it(`Fails Empty Validation`, function () {
    const testModel = new TestModelAsync();
    expect(testModel).not.toBeNull();
    const errors = testModel.hasErrors();
    expect(errors).not.toBeNull();
    if (errors) {
      expect(new Set(Object.keys(errors)).size).toBe(3); // how many properties have errors
      expect(Object.values(errors).length).toBe(3); // how many total errors
    }
  });

  it(`Fails timestamp date validation`, function () {
    const testModel = new TestModelAsync({
      id: 1
    });

    expect(testModel).not.toBeNull();

    // @ts-ignore
    testModel.updatedOn = "test";
    // @ts-ignore
    testModel.createdOn = "test";

    const errors = testModel.hasErrors();
    expect(errors).not.toBeNull();
    if (errors) {
      expect(new Set(Object.keys(errors)).size).toBe(2); // how many properties have errors
      expect(Object.values(errors).length).toBe(2); // how many total errors
    }
  });

  describe("Nested Update Validation", () => {

    beforeAll(() => {
      setModelBuilderFunction(constructFromModel)
    })

    afterAll(() => {
      setModelBuilderFunction()
    })

    beforeEach(() => {
      jest.resetAllMocks()
      jest.restoreAllMocks()
    })

    let model = new OuterTestModel({
      child: {
        value: undefined
      }
    })

    it("Fails the nested validation", (callback) => {
      const manager = new class extends AsyncRamRepository<OuterTestModel> {
        constructor() {
          super(OuterTestModel);
        }
      }
      manager.create("test", model, (err: Err, created?: OuterTestModel) => {
        try {
          expect(err).toBeDefined()
        } catch (e: any) {
          return callback(e)
        }

        callback()
      })
    })

    let manager: AsyncRepository<OuterTestModel>

    it("Passes nested validation", (callback) => {
      manager = new class extends AsyncRamRepository<OuterTestModel> {
        constructor() {
          super(OuterTestModel);
        }
      }

      model = new OuterTestModel(Object.assign({}, model, {
        child: {
          value: "value"
        }
      }))

      manager.create("test", model, (err: Err, created?: OuterTestModel) => {
        try {
          expect(err).toBeUndefined();
          expect(created).toBeDefined()

          const validateMock = jest.spyOn(created?.child as InnerTestModel, "hasErrors");

          expect(created?.hasErrors()).toBeUndefined();
          expect(validateMock).toHaveBeenCalledTimes(1)
        } catch (e: any) {
          return callback(e)
        }
        callback()
      })
    })

    it("fails update due to validation", (callback) => {

      const toUpdate = new OuterTestModel(Object.assign({}, model, {
        child: {
          value: "updated"
        }
      }))

      manager.update("test", toUpdate, (err: Err, updated?: OuterTestModel) => {
        try {
          expect(err).toBeDefined()

          const validateMock = jest.spyOn(toUpdate?.child as InnerTestModel, "hasErrors");

          expect(toUpdate?.hasErrors()).toBeUndefined();
          expect(toUpdate?.hasErrors(model)).toBeDefined();
          expect(validateMock).toHaveBeenCalledTimes(3) // because the update call it one for non update properties, and another for update
        } catch (e: any) {
          return callback(e)
        }
        callback()
      })
    })

    it("also handles lists", (callback) => {
      const manager = new class extends AsyncRamRepository<OuterListTestModel> {
        constructor() {
          super(OuterListTestModel);
        }
      }

      const model = new OuterListTestModel({
        children: [
          {
            value: "1"
          },
          {
            value: "2"
          }
        ]
      })

      manager.create("test", model, (err: Err, created?: OuterListTestModel) => {
        try {
          expect(err).toBeUndefined();
          expect(created).toBeDefined()
          expect(created?.children).toBeDefined()
          expect(created?.children?.length).toEqual(2)

          let validateMock1 = jest.spyOn((created?.children as InnerTestModel[])[0] as InnerTestModel, "hasErrors");
          let validateMock2 = jest.spyOn((created?.children as InnerTestModel[])[1] as InnerTestModel, "hasErrors");

          expect(created?.hasErrors()).toBeUndefined();
          expect(validateMock1).toHaveBeenCalledTimes(1)
          expect(validateMock2).toHaveBeenCalledTimes(1)
        } catch (e: any) {
          return callback(e)
        }

        const toUpdate = new OuterListTestModel({
          children: [
            {
              value: "2"
            },
            {
              value: "3"
            }
          ]
        })
        manager.update("test", toUpdate, (err: Err, updated?: OuterListTestModel) => {
          try {
            expect(err).toBeDefined()

            let validateMock1 = jest.spyOn((toUpdate?.children as InnerTestModel[])[0] as InnerTestModel, "hasErrors");
            let validateMock2 = jest.spyOn((toUpdate?.children as InnerTestModel[])[1] as InnerTestModel, "hasErrors");

            expect(toUpdate?.hasErrors()).toBeUndefined();
            expect(toUpdate?.hasErrors(created)).toBeDefined();
            expect(validateMock1).toHaveBeenCalledTimes(3) // because the update call it one for non update properties, and another for update
            expect(validateMock2).toHaveBeenCalledTimes(3) // because the update call it one for non update properties, and another for update
          } catch (e: any) {
            return callback(e)
          }
          callback()
        })
        callback()
      })
    })
  })
});