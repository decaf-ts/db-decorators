import "reflect-metadata";
import { Model, list } from "@decaf-ts/decorator-validation";
import { Context } from "../../src/repository/Context";
import { Repository } from "../../src/repository/Repository";
import { DBKeys } from "../../src/model/constants";
import {
  serialize,
  serializeAfterAll,
  serializeOnCreateUpdate,
} from "../../src/validation/decorators";
import { RepositoryFlags } from "../../src/repository/types";
import { SerializationError } from "../../src/repository/errors";
import {
  getValidatableUpdateProps,
  validateDecorator,
} from "../../src/model/validation";
import { Validation, ValidationKeys } from "@decaf-ts/decorator-validation";

class C<F extends RepositoryFlags = any> extends Context<F> {}

describe("validation/decorators - serialize", () => {
  test("serializeOnCreateUpdate stringifies object property", async () => {
    const ctx = new C<RepositoryFlags>();
    const model: any = { extra: { a: 1, b: "x" } };
    await serializeOnCreateUpdate.call(
      {} as any,
      ctx as any,
      {},
      "extra" as any,
      model
    );
    expect(typeof model.extra).toBe("string");
    expect(model.extra).toBe(JSON.stringify({ a: 1, b: "x" }));
  });

  test("serializeOnCreateUpdate throws SerializationError on circular structure", async () => {
    const ctx = new C<RepositoryFlags>();
    const circ: any = {};
    circ.self = circ;
    const model: any = { extra: circ };
    await expect(
      serializeOnCreateUpdate.call(
        {} as any,
        ctx as any,
        {},
        "extra" as any,
        model
      )
    ).rejects.toBeInstanceOf(SerializationError);
  });

  test("serializeAfterAll parses JSON string back to object", async () => {
    const ctx = new C<RepositoryFlags>();
    const original = { a: 2, b: "y" };
    const model: any = { extra: JSON.stringify(original) };
    await serializeAfterAll.call(
      {} as any,
      ctx as any,
      {},
      "extra" as any,
      model
    );
    expect(model.extra).toEqual(original);
  });

  test("serializeAfterAll throws SerializationError on invalid JSON", async () => {
    const ctx = new C<RepositoryFlags>();
    const model: any = { extra: "{invalid json}" };
    await expect(
      serializeAfterAll.call({} as any, ctx as any, {}, "extra" as any, model)
    ).rejects.toBeInstanceOf(SerializationError);
  });

  test("serialize() decorator registers metadata", () => {
    class M {}
    const dec = serialize();
    dec(M.prototype, "extra" as any);
    const key = Repository.key(DBKeys.SERIALIZE);
    const meta = Reflect.getMetadata(key, M.prototype, "extra");
    expect(meta).toBeDefined();
  });
});

describe("model/validation helpers", () => {
  test("getValidatableUpdateProps includes LIST decorator", () => {
    class M extends Model {
      @list(String as any)
      tags?: string[];
      name?: string;
      constructor() {
        super();
      }
    }
    const m = new M();
    m.tags = ["a"];
    m.name = "x";
    const res = getValidatableUpdateProps(m as any, []);
    const listEntry = res.find((d) => d.prop === "tags");
    expect(listEntry).toBeDefined();
    expect(
      listEntry!.decorators.some((d) => d.key === ValidationKeys.LIST)
    ).toBe(true);
    // ensure ignored props are excluded
    const res2 = getValidatableUpdateProps(m as any, ["name"]);
    expect(res2.find((d) => d.prop === "name")).toBeUndefined();
  });

  test("validateDecorator throws when validator missing", async () => {
    const spy = jest.spyOn(Validation as any, "get").mockReturnValue(undefined);
    // @ts-expect-error forcing abstract class to be instantiated
    const m = new Model();
    const dec: any = { key: "decaf.validation.MISSING", props: {} };
    expect(() => validateDecorator(m as any, m as any, "a", dec)).toThrow();
    spy.mockRestore();
  });

  test("validateDecorator skips when validator has no updateHasErrors", async () => {
    const mockValidator: any = { hasErrors: jest.fn() };
    const spy = jest
      .spyOn(Validation as any, "get")
      .mockReturnValue(mockValidator);
    // @ts-expect-error forcing abstract class to be instantiated
    const m = new Model();
    const dec: any = { key: "decaf.validation.SIMPLE", props: {} };
    const res = validateDecorator(m as any, m as any, "a", dec);
    expect(res).toBeUndefined();
    expect(mockValidator.hasErrors).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("validateDecorator respects async=false to skip async decorators", async () => {
    const mockValidator: any = { updateHasErrors: jest.fn() };
    const spy = jest
      .spyOn(Validation as any, "get")
      .mockReturnValue(mockValidator);
    // @ts-expect-error forcing abstract class to be instantiated
    const m = new Model();
    const dec: any = { key: "decaf.validation.ASYNC", props: { async: true } };
    const res = validateDecorator(m as any, m as any, "a", dec, false);
    expect(res).toBeUndefined();
    expect(mockValidator.updateHasErrors).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("validateDecorator processes async decorator when async=true", async () => {
    const mockValidator: any = {
      updateHasErrors: jest.fn().mockReturnValue("ERR"),
    };
    const spy = jest
      .spyOn(Validation as any, "get")
      .mockReturnValue(mockValidator);
    // @ts-expect-error forcing abstract class to be instantiated
    const m = new Model();
    const dec: any = { key: "decaf.validation.ASYNC", props: { async: true } };
    const res = await validateDecorator(m as any, m as any, "a", dec, true);
    expect(res).toBe("ERR");
    expect(mockValidator.updateHasErrors).toHaveBeenCalled();
    spy.mockRestore();
  });
});
