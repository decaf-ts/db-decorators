import {
  email,
  list,
  max,
  maxlength,
  min,
  minlength,
  Model,
  model,
  ModelArg,
  ModelErrorDefinition,
  password,
  pattern,
  prop,
  required,
  step,
  type,
  url,
  ValidationKeys,
} from "@decaf-ts/decorator-validation";

@model()
class SimpleTestModel extends Model {
  @required()
  name!: string;

  constructor(model?: ModelArg<SimpleTestModel>) {
    super();
    Model.fromObject(this, model);
  }
}

@model()
class InnerTestModel extends Model {
  @required()
  prop!: string;

  @list(SimpleTestModel)
  listModel?: SimpleTestModel[];

  constructor(model?: ModelArg<InnerTestModel>) {
    super();
    Model.fromObject(this, model);
  }
}

@model()
class TestModel extends Model {
  @type(["string", "number"])
  @required()
  id!: string | number;

  @prop()
  irrelevant?: string;

  @required()
  @max(100)
  @step(5)
  @min(0)
  prop1!: number;

  @maxlength(10)
  @minlength(5)
  prop2?: string;

  @pattern(/^\w+$/g)
  prop3?: string;

  @email()
  prop4?: string;

  @pattern("^\\w+$")
  prop5?: string;

  @url()
  prop6?: string;

  @type(InnerTestModel.name)
  prop7?: InnerTestModel;

  @list(InnerTestModel)
  prop8?: InnerTestModel[];

  @list(InnerTestModel)
  prop9?: InnerTestModel[];

  constructor(model?: ModelArg<TestModel>) {
    super(model);
    Model.fromObject(this, model);
  }
}

@model()
class PasswordTestModel extends Model {
  @password()
  password?: string;

  constructor(model?: ModelArg<PasswordTestModel>) {
    super(model);
  }
}

@model()
class ListModelTest extends Model {
  @list(String)
  @maxlength(2)
  @minlength(1)
  @required()
  strings!: string[];

  constructor(model?: ModelArg<ListModelTest>) {
    super(model);
  }
}

describe("Validation with Update Comparison", function () {
  describe("Model Validation with Comparison", () => {
    it("should validate updates comparing with old model", function () {
      // Original model
      const original = new TestModel({
        id: "id",
        prop1: 25,
        prop2: "tests",
        prop3: "validvalue",
        prop4: "test@pdm.com",
        prop5: "validvalue",
        prop6: "http://www.valid.com",
      });

      // Valid update
      const validUpdate = new TestModel({
        id: "id",
        prop1: 30, // Changed within valid range
        prop2: "newtests", // Changed but still valid
        prop3: "validvalue",
        prop4: "test@pdm.com",
        prop5: "validvalue",
        prop6: "http://www.valid.com",
      });

      const validErrors = validUpdate.hasErrors(original);
      expect(validErrors).toBeUndefined();

      // Invalid update
      const invalidUpdate = new TestModel({
        id: "id",
        prop1: 101, // Exceeds max
        prop2: "to", // Too short
        prop3: "invalid value", // Contains space
        prop4: "invalid-email",
        prop5: "invalid value",
        prop6: "invalid-url",
      });

      const invalidErrors = invalidUpdate.hasErrors(original);
      expect(invalidErrors).toBeDefined();
      expect(invalidErrors).toEqual(
        new ModelErrorDefinition({
          prop1: {
            [ValidationKeys.MAX]: "The maximum value is 100",
            [ValidationKeys.STEP]: "Invalid value. Not a step of 5",
          },
          prop2: {
            [ValidationKeys.MIN_LENGTH]: "The minimum length is 5",
          },
          prop3: {
            [ValidationKeys.PATTERN]: "The value does not match the pattern",
          },
          prop4: {
            [ValidationKeys.EMAIL]: "The value is not a valid email",
          },
          prop5: {
            [ValidationKeys.PATTERN]: "The value does not match the pattern",
          },
          prop6: {
            [ValidationKeys.URL]: "The value is not a valid URL",
          },
        })
      );
    });

    it("should validate password changes with comparison", () => {
      const original = new PasswordTestModel({
        password: "CurrentValid1!",
      });

      // Valid password change
      const validUpdate = new PasswordTestModel({
        password: "NewValidPassword1!",
      });

      expect(validUpdate.hasErrors(original)).toBeUndefined();

      // Invalid password change
      const invalidUpdate = new PasswordTestModel({
        password: "weak",
      });

      const errors = invalidUpdate.hasErrors(original);
      expect(errors).toBeDefined();
      expect(errors).toBeInstanceOf(ModelErrorDefinition);
      expect(errors).toEqual(
        new ModelErrorDefinition({
          password: {
            password:
              "Must be at least 8 characters and contain one of number, lower and upper case letters, and special character (@$!%*?&_-.,)",
          },
        })
      );
    });

    it("should validate list changes with comparison", () => {
      const original = new ListModelTest({
        strings: ["valid", "list"],
      });

      // Valid list change
      const validUpdate = new ListModelTest({
        strings: ["updated", "list"],
      });

      expect(validUpdate.hasErrors(original)).toBeUndefined();

      // Invalid list change (too many items)
      const invalidLengthUpdate = new ListModelTest({
        strings: ["one", "two", "three"],
      });

      const lengthErrors = invalidLengthUpdate.hasErrors(original);
      expect(lengthErrors).toBeDefined();
      expect(lengthErrors).toBeInstanceOf(ModelErrorDefinition);
      expect(lengthErrors).toEqual(
        new ModelErrorDefinition({
          strings: {
            [ValidationKeys.MAX_LENGTH]: "The maximum length is 2",
          },
        })
      );

      // Invalid list change (wrong type)
      const invalidTypeUpdate = new ListModelTest({
        strings: [1, 2] as any,
      });

      const typeErrors = invalidTypeUpdate.hasErrors(original);
      expect(typeErrors).toBeDefined();
      expect(typeErrors).toBeInstanceOf(ModelErrorDefinition);
      expect(typeErrors).toEqual(
        new ModelErrorDefinition({
          strings: {
            list: "Invalid list of String",
          },
        })
      );
    });

    it("should validate partial updates", function () {
      const original = new TestModel({
        id: "id",
        prop1: 25,
        prop2: "tests",
        prop3: "validvalue",
        prop4: "test@pdm.com",
        prop5: "validvalue",
        prop6: "http://www.valid.com",
      });

      // Partial update with only changed fields
      const partialUpdate = new TestModel({
        id: "id",
        prop1: 30, // Only updating this field
      });

      // Should validate only the changed field against the original
      expect(partialUpdate.hasErrors(original)).toBeUndefined();

      partialUpdate.prop1 = undefined;
      const errs = partialUpdate.hasErrors(original);
      expect(errs).toBeDefined();
      expect(errs).toBeInstanceOf(ModelErrorDefinition);
      expect(errs).toEqual(
        new ModelErrorDefinition({
          prop1: {
            [ValidationKeys.REQUIRED]: "This field is required",
          },
        })
      );
    });

    it("should validate nested model changes", function () {
      const original = new TestModel({
        id: "id",
        prop1: "test",
        prop7: new InnerTestModel(),
      });

      // Valid nested model change
      const validUpdate = new TestModel({
        id: "id",
        prop1: 5,
        prop7: new InnerTestModel({ prop: "string" }), // Different instance but same type
      });

      expect(validUpdate.hasErrors(original)).toBeUndefined();

      // Invalid nested model change (wrong type)
      const invalidUpdate = new TestModel({
        id: "id",
        prop1: 11,
        prop7: new TestModel({}) as any, // another instance
      });

      const errors = invalidUpdate.hasErrors(original);
      expect(errors).toBeDefined();
      expect(errors).toBeInstanceOf(ModelErrorDefinition);
      expect(errors).toEqual(
        new ModelErrorDefinition({
          prop1: { step: "Invalid value. Not a step of 5" },
          prop7: {
            type: "Value must be an instance of InnerTestModel",
          },
        })
      );
    });

    it("should validate nested model changes for lists", function () {
      const original = new TestModel({
        id: "id",
        prop1: "test",
        prop8: [
          new InnerTestModel({
            prop: "test",
            listModel: [new SimpleTestModel({ name: "string" })],
          }),
        ],
      });

      // Valid nested model change
      const validUpdate = new TestModel({
        id: "id",
        prop1: 5,
        prop8: [
          new InnerTestModel({
            prop: "test2",
            listModel: [new SimpleTestModel({ name: "updated string" })],
          }),
          new InnerTestModel({ prop: "test2" }),
        ],
      });

      expect(validUpdate.hasErrors(original)).toBeUndefined();

      // Invalid nested model change (wrong type)
      const invalidUpdate = new TestModel({
        id: "id",
        prop1: 11,
        prop8: [],
      });
      invalidUpdate["prop8"] = [new TestModel(), new TestModel()] as any;

      const errors = invalidUpdate.hasErrors(original);
      expect(errors).toBeDefined();
      expect(errors).toBeInstanceOf(ModelErrorDefinition);
      expect(errors).toEqual(
        new ModelErrorDefinition({
          prop1: { step: "Invalid value. Not a step of 5" },
          prop8: {
            list: "Invalid list of InnerTestModel",
          },
        })
      );

      // Invalid nested model list change (wrong type)
      const invalidNestedListUpdate = new TestModel({
        id: "id",
        prop1: 11,
        prop8: [
          new InnerTestModel({
            prop: "test2",
            listModel: [new InnerTestModel()],
          }),
        ],
      });
      invalidNestedListUpdate.prop8[0].listModel = [
        new SimpleTestModel({}),
        new InnerTestModel(), // invalid, diff class instance
      ] as any;

      const nestedListErrs = invalidNestedListUpdate.hasErrors(original);
      expect(nestedListErrs).toBeDefined();
      expect(nestedListErrs).toBeInstanceOf(ModelErrorDefinition);
      expect(nestedListErrs).toEqual(
        new ModelErrorDefinition({
          prop1: { step: "Invalid value. Not a step of 5" },
          prop8: {
            list: [
              new ModelErrorDefinition({
                listModel: {
                  list: "Invalid list of SimpleTestModel",
                },
              }),
            ],
          },
        })
      );
    });
  });
});
