import "reflect-metadata";
import { Context } from "../../src/repository/Context";
import {
  prefixMethod,
  suffixMethod,
  wrapMethodWithContext,
} from "../../src/repository/wrappers";
import { InternalError } from "../../src/repository/errors";

class DummyContext extends Context<any> {}

describe("repository/wrappers", () => {
  test("prefixMethod wraps and forwards transformed args, preserves name", async () => {
    const obj: any = {
      async target(a: number, b: number) {
        return a + b;
      },
    };
    const calls: any[] = [];
    const prefix = function (this: any, a: number, b: number) {
      calls.push(["prefix", a, b]);
      return [a * 2, b * 3];
    };

    prefixMethod(obj, obj.target, prefix);

    expect(obj.target.name).toBe("target");
    const res = await obj.target(2, 3);
    expect(res).toBe(2 * 2 + 3 * 3);
    expect(calls).toEqual([["prefix", 2, 3]]);
  });

  test("suffixMethod wraps and forwards results to suffix, preserves name", async () => {
    const obj: any = {
      async calculate(a: number, b: number) {
        return [a + b, a * b];
      },
    };
    const calls: any[] = [];
    const suffix = function (this: any, sum: number, prod: number) {
      calls.push(["suffix", sum, prod]);
      return sum + prod;
    };

    suffixMethod(obj, obj.calculate, suffix);

    expect(obj.calculate.name).toBe("calculate");
    const res = await obj.calculate(2, 3);
    expect(res).toBe(5 + 6);
    expect(calls).toEqual([["suffix", 5, 6]]);
  });

  test("wrapMethodWithContext enforces presence of Context and chains before/method/after", async () => {
    const obj: any = {
      async run(x: number) {
        return x + 1;
      },
      before: (x: number) => [x * 2, new DummyContext()],
      after: (res: number, ctx: DummyContext) => res + (ctx ? 1 : 0),
    };

    // install proxy wrapper on method name 'run'
    wrapMethodWithContext(obj, obj.before, obj.run, obj.after, "run");

    const res = await obj.run(3);
    // before transforms 3 -> [6, ctx]; method returns 6+1=7; after adds +1=8
    expect(res).toBe(8);
  });

  test("wrapMethodWithContext throws InternalError when before does not return a Context as last arg", async () => {
    const obj: any = {
      async exec(x: number) {
        return x;
      },
      before: (x: number) => [x * 2], // missing Context
      after: (res: number) => res,
    };

    wrapMethodWithContext(obj, obj.before, obj.exec, obj.after, "exec");

    await expect(obj.exec(2)).rejects.toThrow(InternalError);
  });

  test("wrapMethodWithContext resolves promises from before/method/after", async () => {
    const ctx = new DummyContext();
    const obj: any = {
      async call(x: number) {
        return Promise.resolve(x + 10);
      },
      before: async (x: number) => Promise.resolve([x + 1, ctx]),
      after: async (res: number, c: DummyContext) =>
        Promise.resolve(res + (c ? 5 : 0)),
    };

    wrapMethodWithContext(obj, obj.before, obj.call, obj.after, "call");
    const res = await obj.call(1);
    // before: 1->2, method: 12, after: +5 => 17
    expect(res).toBe(17);
  });
});
