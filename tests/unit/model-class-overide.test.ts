import { list, Model, model, ModelArg, ModelErrorDefinition, prop } from "@decaf-ts/decorator-validation";
import { id, readonly } from "../../src";
import { UserModel } from "./TestModel";

Model.setBuilder(Model.fromObject);

export function isPromise(obj: any): boolean {
  return (
    !!obj && typeof obj.then === "function" && typeof obj.catch === "function"
  );
}

describe("Model class override", () => {
  @model()
  class SubmodelOverride extends Model {
    @id()
    id!: string;

    @readonly()
    surname?: string;

    @timeout()


    constructor(arg?: ModelArg<SubmodelOverride>) {
      super(arg);
    }
  }

  @model()
  class ModelOverride extends Model {
    @id()
    id!: string;

    @readonly()
    name?: string;

    @prop()
    submodelOverride?: SubmodelOverride;

    @list(SubmodelOverride)
    submodelOverrideList?: SubmodelOverride[];

    constructor(arg?: ModelArg<ModelOverride>) {
      super(arg);
    }
  }

  it("Overrides the original model's error method", () => {
    let m = new ModelOverride();
    expect(m.hasErrors()).toBeDefined();
    m = new ModelOverride({
      id: "test",
      name: "name1",
    });
    expect(m.hasErrors()).toBeUndefined();
    const m2 = new ModelOverride(
      Object.assign({}, m, {
        name: "name2",
      }),
    );
    expect(m2.hasErrors()).toBeUndefined();
    expect(m2.hasErrors(m)).toBeDefined();
  });

  it("should override original method for nested models", () => {
    const original = new ModelOverride({
      id: "parent1",
      name: "parentName",
      submodelOverride: new SubmodelOverride({
        id: "child1",
        surname: "originalSurname",
      }),
    });

    const modifiedParent = new ModelOverride({
      ...original,
      submodelOverride: new SubmodelOverride({
        id: "child1",
        surname: "modifiedSurname", // Changing readonly field
      }),
    });

    // Should detect error in nested model's readonly field
    const errs = modifiedParent.hasErrors(original);
    expect(errs).toBeDefined();
    expect(errs).toEqual(
      new ModelErrorDefinition({
        submodelOverride: {
          surname: {
            readonly: "This cannot be updated",
          },
        },
      }),
    );

    // Should not error when comparing to itself
    expect(modifiedParent.hasErrors()).toBeUndefined();
  });

  it("should override original method for lists", () => {
    const original = new ModelOverride({
      id: "list1",
      submodelOverrideList: [
        new SubmodelOverride({ id: "item1", surname: "name1" }),
        new SubmodelOverride({ id: "item2", surname: "name2" }),
      ],
    });

    const modified = new ModelOverride({
      ...original,
      submodelOverrideList: [
        new SubmodelOverride({ id: "item1", surname: "name1" }), // Changed readonly
        new SubmodelOverride({ id: "item2", surname: "changedName2" }),
      ],
    });

    // Should detect error in list items readonly fields
    const err = modified.hasErrors(original);
    expect(err).toBeDefined();
    // expect(err).toEqual(
    //   new ModelErrorDefinition({
    //     submodelOverrideList: [
    //       undefined,
    //       new ModelErrorDefinition({
    //         surname: {
    //           readonly: "This cannot be updated",
    //         },
    //       }),
    //     ],
    //   })
    // );

    // Should work with empty lists
    const emptyList = new ModelOverride({
      id: "empty",
      submodelOverrideList: [],
    });
    expect(emptyList.hasErrors()).toBeUndefined();

    // Should work with undefined
    const undefinedList = new ModelOverride({
      id: "empty",
      submodelOverrideList: undefined,
    });
    expect(undefinedList.hasErrors()).toBeUndefined();
  });

  it("should work with async decorators", async () => {
    const address = {
      street: "Main St",
      city: "New York",
    };

    const original = new UserModel({
      id: Date.now().toString(),
      documentId: 1000,
      address: address,
    });

    const modified = new UserModel({
      ...original,
      documentId: 1000,
    });

    // Should detect error in list items readonly fields
    const maybeErrs = modified.hasErrors(original);
    expect(isPromise(maybeErrs)).toBeTruthy();

    const errs = await maybeErrs;
    expect(errs).toBeDefined();
    // expect(err).toEqual(
    //   new ModelErrorDefinition({
    //     submodelOverrideList: [
    //       undefined,
    //       new ModelErrorDefinition({
    //         surname: {
    //           readonly: "This cannot be updated",
    //         },
    //       }),
    //     ],
    //   })
    // );

  });
});
