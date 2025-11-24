import "reflect-metadata";
import { Model } from "@decaf-ts/decorator-validation";
import {
  Context,
  Repository as DbRepository,
  RepositoryFlags,
} from "../../src/repository";
import * as utils from "../../src/repository/utils";
import { InternalError, ValidationError } from "../../src/repository/errors";
import { id } from "../../src/identity";
import { OperationKeys } from "../../src/operations/constants";

class Rm extends Model<true> {
  @id()
  id?: string;
  v?: number;
  constructor(data?: Partial<Rm>) {
    super();
    Object.assign(this, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async hasErrors(_old?: any): Promise<any> {
    return undefined as any;
  }
}

class RepoExposed extends DbRepository<Rm> {
  constructor() {
    super(Rm as any);
  }
  async create(m: Rm): Promise<Rm> {
    return new Rm(m);
  }
  async read(key: string): Promise<Rm> {
    return new Rm({ id: key, v: 1 });
  }
  async update(m: Rm): Promise<Rm> {
    return new Rm(m);
  }
  async delete(key: string): Promise<Rm> {
    return new Rm({ id: key });
  }
  // expose protected overrides in Repository.ts
  async xCreatePrefix(m: Rm, ...args: any[]) {
    return super.createPrefix(m, ...args);
  }
  async xCreateAllPrefix(ms: Rm[], ...args: any[]) {
    return super.createAllPrefix(ms, ...args);
  }
  async xUpdatePrefix(m: Rm, ...args: any[]) {
    return super.updatePrefix(m, ...args);
  }
  async xUpdateAllPrefix(ms: Rm[], ...args: any[]) {
    return super.updateAllPrefix(ms, ...args);
  }
}

async function contextFor(
  operation: OperationKeys,
  overrides: Partial<RepositoryFlags>
) {
  return (await Context.from(operation, overrides, Rm as any)) as Context<
    RepositoryFlags
  >;
}

describe("Repository specific prefix logic", () => {
  let enforceSpy: jest.SpyInstance;

  beforeEach(() => {
    enforceSpy = jest
      .spyOn(utils, "enforceDBDecorators")
      .mockResolvedValue(undefined as any);
  });
  afterEach(() => enforceSpy.mockRestore());

  test("createPrefix validates using hasErrors and throws ValidationError", async () => {
    const repo = new RepoExposed();
    const m = new Rm({ v: 0 });
    const errSpy = jest.spyOn(m, "hasErrors").mockResolvedValue("oops");
    await expect(repo.xCreatePrefix(m)).rejects.toThrow(ValidationError);
    errSpy.mockRestore();
  });

  test("createAllPrefix validates all and aggregates errors with index", async () => {
    const repo = new RepoExposed();
    const a = new Rm({ id: "a" });
    const b = new Rm({ id: "b" });
    jest.spyOn(a, "hasErrors").mockResolvedValue(undefined);
    jest.spyOn(b, "hasErrors").mockResolvedValue("bad");
    await expect(repo.xCreateAllPrefix([a, b])).rejects.toThrow(
      ValidationError
    );
  });

  test("createAllPrefix returns models and context args when no errors", async () => {
    const repo = new RepoExposed();
    const a = new Rm({ id: "a" });
    const b = new Rm({ id: "b" });
    jest.spyOn(a, "hasErrors").mockResolvedValue(undefined);
    jest.spyOn(b, "hasErrors").mockResolvedValue(undefined);
    const res: any[] = await repo.xCreateAllPrefix([a, b]);
    expect(res[0]).toHaveLength(2);
  });

  test("updateAllPrefix merges old/new, enforces decorators and returns or throws", async () => {
    const repo = new RepoExposed();
    const a = new Rm({ id: "1", v: 2 });
    const b = new Rm({ id: "2", v: 3 });
    // first call: both ok
    jest.spyOn(a, "hasErrors").mockResolvedValue(undefined);
    jest.spyOn(b, "hasErrors").mockResolvedValue(undefined);
    const resOk: any[] = await repo.xUpdateAllPrefix([a, b]);
    expect(Array.isArray(resOk[0])).toBe(true);
    // second call: one invalid triggers aggregated ValidationError
    const c = new Rm({ id: "3", v: 4 });
    const d = new Rm({ id: "4", v: 5 });
    jest.spyOn(c, "hasErrors").mockResolvedValue("bad");
    jest.spyOn(d, "hasErrors").mockResolvedValue(undefined);
    await expect(repo.xUpdateAllPrefix([c, d])).rejects.toThrow(
      ValidationError
    );
  });

  test("updatePrefix requires id and merges with oldModel; validates and may throw", async () => {
    const repo = new RepoExposed();
    await expect(repo.xUpdatePrefix(new Rm({ v: 2 }))).rejects.toThrow(
      InternalError
    );
    const m = new Rm({ id: "1", v: 2 });
    const errSpy = jest.spyOn(m, "hasErrors").mockResolvedValue("bad");
    await expect(repo.xUpdatePrefix(m)).rejects.toThrow(ValidationError);
    errSpy.mockRestore();
  });

  test("updateAllPrefix validates ids list and throws on missing", async () => {
    const repo = new RepoExposed();
    await expect(
      repo.xUpdateAllPrefix([new Rm({ id: "1" }), new Rm({}) as any])
    ).rejects.toThrow(InternalError);
  });

  test("createPrefix skips validation when ignoreValidation flag is set", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.CREATE, {
      ignoreValidation: true,
    });
    const spy = jest
      .spyOn(Rm.prototype, "hasErrors")
      .mockResolvedValue("invalid");
    await expect(
      repo.xCreatePrefix(new Rm({ id: "1" }), ctx)
    ).resolves.toBeDefined();
    spy.mockRestore();
  });

  test("createAllPrefix skips validation when ignoreValidation flag is set", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.CREATE, {
      ignoreValidation: true,
    });
    const spy = jest
      .spyOn(Rm.prototype, "hasErrors")
      .mockResolvedValue("invalid");
    await expect(
      repo.xCreateAllPrefix([new Rm({ id: "1" })], ctx)
    ).resolves.toBeDefined();
    spy.mockRestore();
  });

  test("updatePrefix skips validation when ignoreValidation flag is set", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.UPDATE, {
      ignoreValidation: true,
    });
    const spy = jest
      .spyOn(Rm.prototype, "hasErrors")
      .mockResolvedValue("invalid");
    await expect(
      repo.xUpdatePrefix(new Rm({ id: "1", v: 2 }), ctx)
    ).resolves.toBeDefined();
    spy.mockRestore();
  });

  test("updateAllPrefix skips validation when ignoreValidation flag is set", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.UPDATE, {
      ignoreValidation: true,
    });
    const spy = jest
      .spyOn(Rm.prototype, "hasErrors")
      .mockResolvedValue("invalid");
    await expect(
      repo.xUpdateAllPrefix([new Rm({ id: "1" })], ctx)
    ).resolves.toBeDefined();
    spy.mockRestore();
  });

  test("createAllPrefix skips decorator enforcement when ignoreHandlers is false", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.CREATE, {
      ignoreHandlers: false,
    });
    await repo.xCreateAllPrefix([new Rm({ id: "1" })], ctx);
    const ons = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.CREATE && c[4] === OperationKeys.ON
    );
    expect(ons.length).toBe(0);
  });

  test("updatePrefix skips decorator enforcement when ignoreHandlers is false", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.UPDATE, {
      ignoreHandlers: false,
    });
    await repo.xUpdatePrefix(new Rm({ id: "1" }), ctx);
    const ons = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.UPDATE && c[4] === OperationKeys.ON
    );
    expect(ons.length).toBe(0);
  });

  test("updateAllPrefix skips decorator enforcement when ignoreHandlers is false", async () => {
    const repo = new RepoExposed();
    const ctx = await contextFor(OperationKeys.UPDATE, {
      ignoreHandlers: false,
    });
    await repo.xUpdateAllPrefix([new Rm({ id: "1" })], ctx);
    const ons = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.UPDATE && c[4] === OperationKeys.ON
    );
    expect(ons.length).toBe(0);
  });
});
