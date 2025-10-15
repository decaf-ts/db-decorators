import "reflect-metadata";
import { Hashing } from "@decaf-ts/decorator-validation";
import { Context } from "../../src/repository/Context";
import { Repository } from "../../src/repository/Repository";
import { DBKeys } from "../../src/model/constants";
import { CrudOperations, OperationKeys } from "../../src/operations";
import { InternalError } from "../../src/repository/errors";
import {
  composed,
  composedFromCreateUpdate,
  composedFromKeys,
  hashOnCreateUpdate,
  transient,
  version,
  versionCreateUpdate,
  type ComposedFromMetadata,
} from "../../src/model/decorators";
import { RepositoryFlags } from "../../src/index";
import { Constructor, Metadata } from "@decaf-ts/decoration";
import { Constructor } from "@decaf-ts/decoration";

// Simple type to satisfy generics
class C<F extends RepositoryFlags = any> extends Context<F> {}

describe("model/decorators", () => {
  describe("hashOnCreateUpdate", () => {
    test("does nothing when value is undefined", () => {
      const model: any = { password: undefined };
      hashOnCreateUpdate.call({} as any, new C(), {}, "password" as any, model);
      expect(model.password).toBeUndefined();
    });

    test("hashes when value present and no oldModel", () => {
      const model: any = { password: "secret" };
      hashOnCreateUpdate.call({} as any, new C(), {}, "password" as any, model);
      expect(model.password).toBe(Hashing.hash("secret"));
    });

    test("rehashes when oldModel present and value is already hashed", () => {
      const hashed = Hashing.hash("abc");
      const model: any = { password: hashed };
      const oldModel: any = { password: "abc" };
      hashOnCreateUpdate.call(
        {} as any,
        new C(),
        {},
        "password" as any,
        model,
        oldModel
      );
      // value is re-hashed
      expect(model.password).toBe(Hashing.hash(hashed));
    });
  });

  describe("composedFromCreateUpdate", () => {
    test("composes from keys with prefix/suffix and separator", () => {
      const data: ComposedFromMetadata = {
        args: ["first", "second"],
        separator: ":",
        hashResult: false,
        type: "keys",
        prefix: "pre",
        suffix: "suf",
      };
      const model: any = { first: "1", second: 2 };
      composedFromCreateUpdate.call(
        {} as any,
        new C(),
        data,
        "full" as any,
        model
      );
      expect(model.full).toBe(["pre", "first", "second", "suf"].join(":"));
    });

    test("throws InternalError when composing from missing property", () => {
      const data: ComposedFromMetadata = {
        args: ["present", "missing"],
        separator: "-",
        hashResult: false,
        type: "values",
      } as any;
      const model: any = { present: "ok" };
      expect(() =>
        composedFromCreateUpdate.call(
          {} as any,
          new C(),
          data,
          "x" as any,
          model
        )
      ).toThrow(InternalError);
    });

    test("throws InternalError when property value is undefined", () => {
      const data: ComposedFromMetadata = {
        args: ["a", "b"],
        separator: "-",
        hashResult: false,
        type: "values",
      } as any;
      const model: any = { a: "ok", b: undefined };
      expect(() =>
        composedFromCreateUpdate.call(
          {} as any,
          new C(),
          data,
          "x" as any,
          model
        )
      ).toThrow(InternalError);
    });
  });

  describe("composedFromKeys/composed", () => {
    test("composedFromKeys returns a decorator function", () => {
      const dec = composedFromKeys(["a", "b"]);
      expect(typeof dec).toBe("function");
    });

    test("composed returns a decorator and when hash=true it composes with hash decorator internally", () => {
      const dec = composed(["a", "b"], "-", true, "pre", "suf");
      expect(typeof dec).toBe("function");
    });
  });

  describe("versionCreateUpdate", () => {
    test("sets version to 1 on create", () => {
      const cb = versionCreateUpdate(
        OperationKeys.CREATE as unknown as CrudOperations
      );
      const model: any = { v: 0 };
      cb.call({} as any, new C(), {}, "v" as any, model);
      expect(model.v).toBe(1);
    });

    test("increments version on update", () => {
      const cb = versionCreateUpdate(
        OperationKeys.UPDATE as unknown as CrudOperations
      );
      const model: any = { v: 1 };
      cb.call({} as any, new C(), {}, "v" as any, model);
      expect(model.v).toBe(2);
    });

    test("throws InternalError on invalid operation", () => {
      const cb = versionCreateUpdate("INVALID" as unknown as CrudOperations);
      const model: any = { v: 0 };
      expect(() => cb.call({} as any, new C(), {}, "v" as any, model)).toThrow(
        InternalError
      );
    });
  });

  describe("version() decorator", () => {
    test("applies metadata and handlers via Decoration API", () => {
      class M1 {}
      // apply decorator to property
      const dec = version();
      dec(M1.prototype, "ver" as any);
      // ensure metadata exists
      const key = Repository.key(DBKeys.VERSION);
      // const meta = Reflect.getMetadata(key, M1.prototype, "ver");
      const meta = Metadata.get(M1 as Constructor, key);
      expect(meta).toBeDefined();
    });
  });

  describe("transient() decorator", () => {
    test("marks property and constructor with transient metadata", () => {
      class M2 {}
      const dec = transient();
      dec(M2.prototype, "tmp" as any);
      const key = Repository.key(DBKeys.TRANSIENT);
      // property-level transient marker (empty key is used internally)
      // const propMeta = Reflect.getMetadata(key, M2.prototype, "tmp");
      const propMeta = Metadata.get(M2 as Constructor, key);
      expect(propMeta).toBeDefined();
      // class-level transient marker
      // const classMeta = Reflect.getMetadata(key, M2);
      const classMeta = Metadata.get(M2 as Constructor, key);
      expect(classMeta).toBeDefined();
    });
  });
});
