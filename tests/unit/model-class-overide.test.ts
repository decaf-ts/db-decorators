import { ModelArg, Model, model } from "@decaf-ts/decorator-validation";
import { id, readonly } from "../../src";

Model.setBuilder(Model.fromObject);

describe("Model class override", () => {
  @model()
  class ModelOverride extends Model {
    @id()
    id!: string;

    @readonly()
    name?: string;

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
      })
    );
    expect(m2.hasErrors()).toBeUndefined();
    expect(m2.hasErrors(m)).toBeDefined();
  });
});
