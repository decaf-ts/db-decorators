import "reflect-metadata";
import { Model } from "@decaf-ts/decorator-validation";
import { Repository } from "../../src/repository/Repository";
import * as identity from "../../src/identity/utils";
import * as utils from "../../src/repository/utils";
import { InternalError, ValidationError } from "../../src/repository/errors";

class Rm extends Model<true> {
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

class RepoExposed extends Repository<Rm> {
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

describe("Repository specific prefix logic", () => {
  let pkSpy: jest.SpyInstance;
  let enforceSpy: jest.SpyInstance;

  beforeAll(() => {
    pkSpy = jest
      .spyOn(identity, "findPrimaryKey" as any)
      .mockReturnValue({ id: "id", props: {} });
  });
  afterAll(() => pkSpy.mockRestore());

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
});
