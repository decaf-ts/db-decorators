import "../../src/overrides";
import { Model } from "@decaf-ts/decorator-validation";
import { transient } from "../../src/model/decorators";
import { SerializationError } from "../../src/repository/errors";

describe("model/utils", () => {
  test("isTransient returns true when transient decorator applied", () => {
    class M2 {
      @transient()
      tmp?: string;
    }
    const m = new M2();
    expect(Model.isTransient(m as any)).toBe(true);
  });

  test("modelToTransient splits transient properties and rebuilds model", () => {
    class M4 {
      a = 1;
      @transient()
      b = 2;
    }
    const m = new M4();
    // Mock Model.build to avoid requiring model registration
    const buildSpy = jest
      .spyOn(Model as any, "build")
      .mockImplementation((obj: any) =>
        Object.assign(Object.create(M4.prototype), obj)
      );
    const res = Model.toTransient(m as any);
    // transient holds b
    expect(res.transient).toEqual({ b: 2 });
    // model has only a and is instance of same constructor
    expect(res.model).toBeInstanceOf(M4);
    expect((res.model as any).b).toBeUndefined();
    buildSpy.mockRestore();
  });

  test("modelToTransient throws SerializationError when getter throws", () => {
    class M5 {
      a = 1;
      private _b = 2;
      @transient()
      get b() {
        throw new Error("boom");
      }
    }
    const m = new M5();
    expect(() => Model.toTransient(m as any)).toThrow(SerializationError);
  });
});
