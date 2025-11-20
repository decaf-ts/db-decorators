import "reflect-metadata";
import { Model } from "@decaf-ts/decorator-validation";
import { BaseRepository } from "../../src/repository/BaseRepository";
import * as utils from "../../src/repository/utils";
import { OperationKeys } from "../../src/operations/constants";
import { InternalError } from "../../src/repository/errors";
import { id } from "../../src/identity";

class U extends Model<boolean> {
  @id()
  id?: string;
  name?: string;
  constructor(data?: Partial<U>) {
    super();
    Object.assign(this, data);
  }
}

class ExposedBaseRepo extends BaseRepository<U> {
  constructor() {
    super(U as any);
  }
  // implement abstract methods trivially
  async create(m: U): Promise<U> {
    return new U(m);
  }
  async read(key: string): Promise<U> {
    return new U({ id: key, name: "read" });
  }
  async update(m: U): Promise<U> {
    return new U(m);
  }
  async delete(key: string): Promise<U> {
    return new U({ id: key, name: "del" });
  }

  // expose protected methods for testing coverage
  async xCreatePrefix(m: U, ...args: any[]) {
    return super.createPrefix(m, ...args);
  }
  async xCreateSuffix(m: U, c: any) {
    return super.createSuffix(m, c);
  }
  async xCreateAllPrefix(ms: U[], ...args: any[]) {
    return super.createAllPrefix(ms, ...args);
  }
  async xCreateAllSuffix(ms: U[], c: any) {
    return super.createAllSuffix(ms, c);
  }
  async xReadPrefix(k: string, ...args: any[]) {
    return super.readPrefix(k, ...args);
  }
  async xReadSuffix(m: U, c: any) {
    return super.readSuffix(m, c);
  }
  async xReadAllPrefix(ks: (string | number)[], ...args: any[]) {
    return super.readAllPrefix(ks as any, ...args);
  }
  async xReadAllSuffix(ms: U[], c: any) {
    return super.readAllSuffix(ms, c);
  }
  async xUpdatePrefix(m: U, ...args: any[]) {
    return super.updatePrefix(m, ...args);
  }
  async xUpdateSuffix(m: U, c: any) {
    return super.updateSuffix(m, c);
  }
  async xUpdateAllPrefix(ms: U[], ...args: any[]) {
    return super.updateAllPrefix(ms, ...args);
  }
  async xUpdateAllSuffix(ms: U[], c: any) {
    return super.updateAllSuffix(ms, c);
  }
  async xDeletePrefix(k: any, ...args: any[]) {
    return super.deletePrefix(k, ...args);
  }
  async xDeleteSuffix(m: U, c: any) {
    return super.deleteSuffix(m, c);
  }
  async xDeleteAllPrefix(ks: (string | number)[], ...args: any[]) {
    return super.deleteAllPrefix(ks as any, ...args);
  }
  async xDeleteAllSuffix(ms: U[], c: any) {
    return super.deleteAllSuffix(ms, c);
  }
  mergePublic(oldM: U, m: U) {
    return this.merge(oldM, m);
  }
}

describe("BaseRepository protected methods coverage", () => {
  let enforceSpy: jest.SpyInstance;

  beforeEach(() => {
    enforceSpy = jest
      .spyOn(utils, "enforceDBDecorators")
      .mockResolvedValue(undefined as any);
  });
  afterEach(() => enforceSpy.mockRestore());

  test("pk getter triggers findPrimaryKey and pkProps caches", async () => {
    const repo = new ExposedBaseRepo();
    // access pk twice to exercise cache path
    const pk1 = repo.pk;
    const props = (repo as any).pkProps; // getter indirectly uses this.pk
    const pk2 = repo.pk;
    expect(pk1).toBe("id");
    expect(pk2).toBe("id");
    expect(props).toBeDefined();
  });

  test("createPrefix and createSuffix enforce decorators (ON/AFTER)", async () => {
    const repo = new ExposedBaseRepo();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [model, key, ctx] = await repo.xCreatePrefix(
      new U({ name: "x" }),
      "extra"
    );
    expect(model).toBeInstanceOf(U);
    await repo.xCreateSuffix(model, ctx);
    const pairs = enforceSpy.mock.calls.map((c) => [c[3], c[4]]);
    expect(pairs).toEqual(
      expect.arrayContaining([
        [OperationKeys.CREATE, OperationKeys.ON],
        [OperationKeys.CREATE, OperationKeys.AFTER],
      ])
    );
  });

  test("createAllPrefix and createAllSuffix enforce decorators for all", async () => {
    const repo = new ExposedBaseRepo();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [models, key, ctx] = await repo.xCreateAllPrefix(
      [new U({ name: "a" }), new U({ name: "b" })],
      "extra"
    );
    await repo.xCreateAllSuffix(models, ctx);
    const ons = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.CREATE && c[4] === OperationKeys.ON
    ).length;
    const afters = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.CREATE && c[4] === OperationKeys.AFTER
    ).length;
    expect(ons).toBeGreaterThanOrEqual(2);
    expect(afters).toBeGreaterThanOrEqual(2);
  });

  test("readPrefix/readSuffix and readAllPrefix/readAllSuffix enforce decorators", async () => {
    const repo = new ExposedBaseRepo();
    await repo.xReadPrefix("10");
    await repo.xReadSuffix(new U({ id: "10" }), {} as any);
    await repo.xReadAllPrefix(["1", "2"]);
    await repo.xReadAllSuffix(
      [new U({ id: "1" }), new U({ id: "2" })],
      {} as any
    );
    const readOns = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.READ && c[4] === OperationKeys.ON
    ).length;
    const readAfters = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.READ && c[4] === OperationKeys.AFTER
    ).length;
    expect(readOns).toBeGreaterThanOrEqual(2);
    expect(readAfters).toBeGreaterThanOrEqual(2);
  });

  test("updatePrefix requires id and throws when missing", async () => {
    const repo = new ExposedBaseRepo();
    await expect(repo.xUpdatePrefix(new U({ name: "no-id" }))).rejects.toThrow(
      InternalError
    );
  });

  test("updatePrefix/updateSuffix, updateAllPrefix/updateAllSuffix enforce decorators", async () => {
    const repo = new ExposedBaseRepo();
    const [model, , ctx] = await repo.xUpdatePrefix(
      new U({ id: "1", name: "a" })
    );
    await repo.xUpdateSuffix(model, ctx);
    const [models, , ctx2] = await repo.xUpdateAllPrefix([
      new U({ id: "1", name: "a" }),
    ]);
    await repo.xUpdateAllSuffix(models, ctx2);
    const updOns = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.UPDATE && c[4] === OperationKeys.ON
    ).length;
    const updAfters = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.UPDATE && c[4] === OperationKeys.AFTER
    ).length;
    expect(updOns).toBeGreaterThanOrEqual(2);
    expect(updAfters).toBeGreaterThanOrEqual(2);
  });

  test("deletePrefix/deleteSuffix and deleteAllPrefix/deleteAllSuffix enforce decorators", async () => {
    const repo = new ExposedBaseRepo();
    await repo.xDeletePrefix("7");
    await repo.xDeleteSuffix(new U({ id: "7" }), {} as any);
    await repo.xDeleteAllPrefix(["1", "2"]);
    await repo.xDeleteAllSuffix(
      [new U({ id: "1" }), new U({ id: "2" })],
      {} as any
    );
    const delOns = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.DELETE && c[4] === OperationKeys.ON
    ).length;
    const delAfters = enforceSpy.mock.calls.filter(
      (c) => c[3] === OperationKeys.DELETE && c[4] === OperationKeys.AFTER
    ).length;
    expect(delOns).toBeGreaterThanOrEqual(2);
    expect(delAfters).toBeGreaterThanOrEqual(2);
  });

  test("merge combines old and new values, drops undefined, toString uses class name", () => {
    const repo = new ExposedBaseRepo();
    const merged = repo.mergePublic(
      new U({ id: "1", name: "old", extra: "x" } as any),
      new U({ id: "1", name: "new", extra: undefined as any } as any)
    );
    expect(merged).toBeInstanceOf(U);
    expect(merged.name).toBe("new");
    expect((merged as any).extra).toBe("x");
    expect(repo.toString()).toContain("U");
  });
});
