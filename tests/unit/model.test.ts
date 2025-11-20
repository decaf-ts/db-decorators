import { TestModel } from "./TestModel";
import {
  list,
  minlength,
  Model,
  model,
  ModelErrorDefinition,
  required,
} from "@decaf-ts/decorator-validation";
import type { ModelArg } from "@decaf-ts/decorator-validation";
import { readonly } from "../../src/validation/decorators";
import { RamRepository } from "./RamRepository";
import { ValidationError } from "../../src/repository/errors";
import { IRepository } from "../../src/interfaces/IRepository";
import { Injectables } from "@decaf-ts/injectable-decorators";
import { id } from "../../src";
import { Metadata } from "@decaf-ts/decoration";

@model()
class InnerTestModel extends Model {
  @id()
  id!: string;

  @readonly()
  @required()
  value!: string;

  constructor(arg: ModelArg<InnerTestModel>) {
    super(arg);
  }

  hasErrors(
    previousVersion?: any,
    ...exclusions: any[]
  ): ModelErrorDefinition | undefined {
    return super.hasErrors(previousVersion, ...exclusions);
  }
}

@model()
class OuterTestModel extends Model {
  @id()
  id!: string;

  @required()
  child!: InnerTestModel;

  constructor(arg: ModelArg<OuterTestModel>) {
    super(arg);
  }

  hasErrors(
    previousVersion?: any,
    ...exclusions: any[]
  ): ModelErrorDefinition | undefined {
    return super.hasErrors(previousVersion, ...exclusions);
  }
}

@model()
class OuterListTestModel extends Model {
  @id()
  id!: string;

  @list(InnerTestModel)
  @minlength(1)
  @required()
  children!: InnerTestModel[];

  constructor(arg: ModelArg<OuterTestModel>) {
    super(arg);
  }
}

@model()
class PlainModel extends Model {
  @id()
  pk!: string;

  @readonly()
  surname?: string;

  constructor(arg?: ModelArg<PlainModel>) {
    super(arg);
  }
}

describe(`DB extended Model`, function () {
  it(`Instantiates`, function () {
    const testModel = new TestModel();
    expect(testModel).not.toBeNull();
  });

  it(`Fails Empty Validation`, function () {
    const testModel = new TestModel();
    expect(testModel).not.toBeNull();
    const errors = testModel.hasErrors();
    expect(errors).not.toBeNull();
    if (errors) {
      expect(new Set(Object.keys(errors)).size).toBe(3); // how many properties have errors
      expect(Object.values(errors).length).toBe(3); // how many total errors
    }
  });

  it(`Fails timestamp date validation`, function () {
    const testModel = new TestModel({
      id: 1,
    });

    expect(testModel).not.toBeNull();

    // @ts-expect-error illegal override for test
    testModel.updatedOn = "test";
    // @ts-expect-error illegal override for test
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
      Model.setBuilder(Model.fromModel);
    });

    afterAll(() => {
      Model.setBuilder();
    });

    beforeEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
      Injectables.reset();
    });

    class OuterTestModelRepo extends RamRepository<OuterTestModel> {
      constructor() {
        super(OuterTestModel);
      }
    }

    it("Fails the nested validation", async () => {
      const manager = new OuterTestModelRepo();

      const model = new OuterTestModel({
        id: Date.now().toString(),
        child: {
          id: Date.now().toString(),
          value: undefined,
        },
      });

      await expect(() => manager.create(model)).rejects.toThrowError(
        ValidationError
      );
    });

    let manager: IRepository<OuterTestModel, any>;

    let created: OuterTestModel;

    it("Passes nested validation", async () => {
      manager = new OuterTestModelRepo();
      const model = new OuterTestModel({
        id: Date.now().toString(),
        child: {
          id: Date.now().toString(),
          value: "value",
        },
      });

      created = await manager.create(model);
      expect(created).toBeDefined();

      const validateMock = jest.spyOn(
        created?.child as InnerTestModel,
        "hasErrors"
      );
      expect(created.hasErrors()).toBeUndefined();
      expect(validateMock).toHaveBeenCalledTimes(1);
    });

    it("fails update due to validation", async () => {
      const toUpdate = new OuterTestModel({
        id: created.id,
        child: {
          id: (created.child as InnerTestModel).id,
          value: "updated",
        },
      });
      const validateMock = jest.spyOn(
        toUpdate?.child as InnerTestModel,
        "hasErrors"
      );

      await expect(() => manager.update(toUpdate)).rejects.toThrowError(
        ValidationError
      );

      expect(toUpdate.hasErrors()).toBeUndefined();
      const errs = toUpdate.hasErrors(created);
      expect(errs).toBeDefined();
      expect(validateMock).toHaveBeenCalledTimes(3); // because the update call it one for non update properties, and another for update
    });

    class OuterListTestRepository extends RamRepository<OuterListTestModel> {
      constructor() {
        super(OuterListTestModel);
      }
    }

    it("also handles lists", async () => {
      const manager = new OuterListTestRepository();

      const model = new OuterListTestModel({
        id: Date.now().toString(),
        children: [
          {
            id: Date.now().toString(),
            value: "1",
          },
          {
            id: Date.now().toString(),
            value: "2",
          },
        ],
      });

      const created = await manager.create(model);

      expect(created).toBeDefined();
      expect(created?.children).toBeDefined();
      expect(created?.children?.length).toEqual(2);

      let validateMock1 = jest.spyOn(
        (created?.children as InnerTestModel[])[0] as InnerTestModel,
        "hasErrors"
      );
      let validateMock2 = jest.spyOn(
        (created?.children as InnerTestModel[])[1] as InnerTestModel,
        "hasErrors"
      );

      expect(created?.hasErrors()).toBeUndefined();
      expect(validateMock1).toHaveBeenCalledTimes(1);
      expect(validateMock2).toHaveBeenCalledTimes(1);

      const toUpdate = new OuterListTestModel({
        id: created.id,
        children: [
          {
            id: (created.children as InnerTestModel[])[0].id,
            value: "2",
          },
          {
            id: (created.children as InnerTestModel[])[1].id,
            value: "3",
          },
        ],
      });

      validateMock1 = jest.spyOn(
        (toUpdate?.children as InnerTestModel[])[0] as InnerTestModel,
        "hasErrors"
      );
      validateMock2 = jest.spyOn(
        (toUpdate?.children as InnerTestModel[])[1] as InnerTestModel,
        "hasErrors"
      );
      await expect(() => manager.update(toUpdate)).rejects.toThrowError(
        ValidationError
      );

      expect(toUpdate?.hasErrors()).toBeUndefined();
      expect(toUpdate?.hasErrors(created)).toBeDefined();
      expect(validateMock1).toHaveBeenCalledTimes(3); // because the update call it one for non update properties, and another for update
      expect(validateMock2).toHaveBeenCalledTimes(3); // because the update call it one for non update properties, and another for update
    });

    it("tests id retrieval", () => {
      const newModel = new PlainModel({ pk: "pktest" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const meta = Metadata.get(newModel.constructor as any);
      const pkprop = Model.pk(newModel);
      expect(pkprop).toEqual("pk");

      const pkValue = Model.pk(newModel, true);
      expect(pkValue).toEqual("pktest");
    });
  });
});
