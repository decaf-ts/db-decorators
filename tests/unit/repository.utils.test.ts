import "reflect-metadata";
import { OperationKeys } from "../../src/operations/constants";
import { getDbDecorators } from "../../src/repository/utils";
import { getHandlerArgs } from "../../src/index";

describe("repository/utils", () => {
  describe("getDbDecorators", () => {
    test("returns undefined when no operation decorators exist", () => {
      class M {
        p?: string;
      }
      const m = new M();
      const onDecs = getDbDecorators(
        m as any,
        OperationKeys.CREATE,
        OperationKeys.ON
      );
      expect(onDecs).toBeUndefined();
    });
  });

  describe("getHandlerArgs", () => {
    test("merges handlers across prototype chain", () => {
      class Base {}
      class Child extends Base {}
      const dec: any = {
        props: {
          handlers: {
            [Base.name]: { p: { hb: { data: { from: "base" } } } },
            [Child.name]: { p: { hc: { data: { from: "child" } } } },
          },
        },
      };
      const res = getHandlerArgs(dec, "p", new Child() as any) as any;
      expect(res).toBeDefined();
      const keys = Object.keys(res);
      expect(keys).toContain("hb");
      expect(keys).toContain("hc");
    });
  });
});
