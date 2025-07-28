import {
  list,
  maxlength,
  minlength,
  Model,
  model,
  ModelArg,
  ModelErrorDefinition,
  required,
} from "@decaf-ts/decorator-validation";

describe("Validation Lists with Update Comparison", () => {
  @model()
  class SyncItemModel extends Model {
    @required()
    name!: string;

    constructor(model?: ModelArg<SyncItemModel>) {
      super(model);
    }
  }

  @model()
  class SyncRootModel extends Model {
    @list(SyncItemModel)
    @minlength(1)
    @maxlength(2)
    @required()
    items!: SyncItemModel[];

    @list(Number)
    numbers!: number[];

    constructor(model?: ModelArg<SyncRootModel>) {
      super(model);
    }
  }

  it("should validate updates comparing with old model", () => {
    // Original model
    const original = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }),
      ],
      numbers: [1, 2, 3],
    });

    // Update model with valid changes
    const validUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1 updated" }), // Name changed
        new SyncItemModel({ name: "Item 2" }), // Unchanged
      ],
      numbers: [1, 2, 3, 4], // @maxlength not applied here
    });

    // Should pass validation
    const validErrors = validUpdate.hasErrors(original);
    expect(validErrors).toBeUndefined();

    // Update model with invalid changes
    const invalidUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "" }), // Empty name - invalid
        new SyncItemModel({ name: "Item 2" }),
      ],
    });

    // Should fail validation
    const invalidErrors = invalidUpdate.hasErrors(original);
    expect(invalidErrors).toBeDefined();
    expect(invalidErrors).toBeInstanceOf(ModelErrorDefinition);
    expect(invalidErrors).toEqual(
      new ModelErrorDefinition({
        items: {
          list: [
            new ModelErrorDefinition({
              name: {
                required: "This field is required",
              },
            }),
            undefined,
          ],
        },
      })
    );
  });

  it("should validate list length changes during update", () => {
    const original = new SyncRootModel({
      items: [new SyncItemModel({ name: "Item 1" })],
    });

    // Valid length change (within bounds)
    const validLengthUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }), // Adding one item
      ],
    });

    expect(validLengthUpdate.hasErrors(original)).toBeUndefined();

    // Invalid length change (exceeds maxlength)
    const invalidLengthUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }),
        new SyncItemModel({ name: "Item 3" }), // Exceeds maxlength
      ],
    });

    const errors = invalidLengthUpdate.hasErrors(original);
    expect(errors).toBeDefined();
    expect(errors).toBeInstanceOf(ModelErrorDefinition);
    expect(errors).toEqual(
      new ModelErrorDefinition({
        items: {
          maxlength: "The maximum length is 2",
        },
      })
    );
  });

  it("should validate nested model changes in lists", () => {
    const original = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }),
      ],
    });

    // Valid nested change
    const validNestedUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1 updated" }), // Changed
        new SyncItemModel({ name: "Item 2" }), // Unchanged
      ],
    });

    expect(validNestedUpdate.hasErrors(original)).toBeUndefined();

    // Invalid nested change
    const invalidNestedUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "" }), // Invalid
        new SyncItemModel({ name: "Item 2" }),
      ],
    });

    const errors = invalidNestedUpdate.hasErrors(original);
    expect(errors).toBeDefined();
    expect(errors).toBeInstanceOf(ModelErrorDefinition);
    expect(errors).toEqual(
      new ModelErrorDefinition({
        items: {
          list: [
            new ModelErrorDefinition({
              name: {
                required: "This field is required",
              },
            }),
            undefined,
          ],
        },
      })
    );
  });

  it("should validate when removing required items", () => {
    const original = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }),
      ],
    });

    // Trying to remove all items (violates @minlength(1))
    const invalidUpdate = new SyncRootModel({
      items: [], // Empty array
    });

    const errors = invalidUpdate.hasErrors(original);
    expect(errors).toBeDefined();
    expect(errors).toBeInstanceOf(ModelErrorDefinition);
    expect(errors).toEqual(
      new ModelErrorDefinition({
        items: {
          minlength: "The minimum length is 1",
        },
      })
    );
  });

  it("should validate type changes in lists", () => {
    const original = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }),
      ],
      numbers: [1, 2, 3],
    });

    // Valid type change
    const validTypeUpdate = new SyncRootModel({
      items: [
        new SyncItemModel({ name: "Item 1" }),
        new SyncItemModel({ name: "Item 2" }),
      ],
      numbers: [4, 5, 6], // Still numbers
    });

    const errs = validTypeUpdate.hasErrors(original);
    expect(errs).toBeUndefined();

    // Invalid type change
    const invalidTypeUpdate = new SyncRootModel({
      items: [1, 2, 3],
      numbers: ["a", "b", "c"] as any, // Wrong type
    });

    const errors = invalidTypeUpdate.hasErrors(original);
    expect(errors).toBeDefined();
    expect(errors).toBeInstanceOf(ModelErrorDefinition);
    expect(errors).toEqual(
      new ModelErrorDefinition({
        items: {
          maxlength: "The maximum length is 2",
          list: "Invalid list of SyncItemModel",
        },
        numbers: {
          list: "Invalid list of Number",
        },
      })
    );
  });
});
