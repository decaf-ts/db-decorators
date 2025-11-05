import "reflect-metadata";
import { Model } from "@decaf-ts/decorator-validation";
import { InternalError, ValidationError } from "../../src/repository/errors";
import { Repository } from "../../src/repository/Repository";
import * as utils from "../../src/repository/utils";
import { OperationKeys } from "../../src/operations/constants";
import { id } from "../../src/identity";

class T extends Model<true> {
  @id()
  id?: string;
  name?: string;
  constructor(data?: Partial<T>) {
    super();
    Object.assign(this, data);
  }
  // Will be spied/mocked per test
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async hasErrors(_old?: any): Promise<any> {
    return undefined as any;
  }
}

class TestRepo extends Repository<T> {
  private storage = new Map<string, T>();
  constructor() {
    super(T as any);
  }
  async create(model: T): Promise<T> {
    // emulate DB create
    if (!model.id) model.id = String(this.storage.size + 1);
    this.storage.set(model.id!, new T(model));
    return new T(model);
  }
  async read(key: string): Promise<T> {
    const found = this.storage.get(key) || new T({ id: key, name: "from-db" });
    return new T(found);
  }
  async update(model: T): Promise<T> {
    this.storage.set(model.id!, new T(model));
    return new T(model);
  }
  async delete(key: string): Promise<T> {
    const found = await this.read(key);
    this.storage.delete(key);
    return found;
  }
}

describe("repository/BaseRepository & Repository integration", () => {
  let enforceSpy: jest.SpyInstance;

  beforeEach(() => {
    enforceSpy = jest
      .spyOn(utils, "enforceDBDecorators")
      .mockResolvedValue(undefined as any);
  });
  afterEach(() => {
    enforceSpy.mockRestore();
  });

  test("create flows through prefix and suffix, validates model, calls decorators ON and AFTER", async () => {
    const repo = new TestRepo();
    const m = new T({ name: "ok" });
    const created = await repo.create(m);
    expect(created).toBeInstanceOf(T);
    const calls = enforceSpy.mock.calls.map((c) => [c[3], c[4]]);
    expect(calls).toEqual(
      expect.arrayContaining([
        [OperationKeys.CREATE, OperationKeys.ON],
        [OperationKeys.CREATE, OperationKeys.AFTER],
      ])
    );
  });

  test("create throws ValidationError when model.hasErrors returns message", async () => {
    const repo = new TestRepo();
    const m = new T({ name: "bad" });
    const errSpy = jest.spyOn(m, "hasErrors").mockResolvedValue("invalid");
    await expect(repo.create(m)).rejects.toThrow(ValidationError);
    errSpy.mockRestore();
  });

  test("createAll validates all and aggregates errors", async () => {
    const repo = new TestRepo();
    const ok = new T({ name: "ok" });
    const bad = new T({ name: "bad" });
    jest.spyOn(ok, "hasErrors").mockResolvedValue(undefined);
    jest.spyOn(bad, "hasErrors").mockResolvedValue("badness");
    await expect(repo.createAll([ok, bad])).rejects.toThrow(ValidationError);
  });

  test("read calls ON and AFTER decorators via wrappers", async () => {
    const repo = new TestRepo();
    const model = await repo.read("10");
    expect(model).toBeInstanceOf(T);
    const pairs = enforceSpy.mock.calls.map((c) => [c[3], c[4]]);
    expect(pairs).toEqual(
      expect.arrayContaining([
        [OperationKeys.READ, OperationKeys.ON],
        [OperationKeys.READ, OperationKeys.AFTER],
      ])
    );
  });

  test("update throws InternalError when id is missing", async () => {
    const repo = new TestRepo();
    const m = new T({ name: "x" });
    await expect(repo.update(m)).rejects.toThrow(InternalError);
  });

  test("update flows through ON and AFTER and validates with oldModel", async () => {
    const repo = new TestRepo();
    await repo.create(new T({ id: "1", name: "old" }));
    const m = new T({ id: "1", name: "new" });
    const model = await repo.update(m);
    expect(model.name).toBe("new");
    const pairs = enforceSpy.mock.calls.map((c) => [c[3], c[4]]);
    expect(pairs).toEqual(
      expect.arrayContaining([
        [OperationKeys.UPDATE, OperationKeys.ON],
        [OperationKeys.UPDATE, OperationKeys.AFTER],
      ])
    );
  });

  test("updateAll validates ids and aggregates errors", async () => {
    const repo = new TestRepo();
    await repo.create(new T({ id: "1", name: "a" }));
    const ok = new T({ id: "1", name: "A" });
    const missingId = new T({ name: "no-id" }) as any;
    await expect(repo.updateAll([ok, missingId])).rejects.toThrow(
      InternalError
    );
  });

  test("delete flows through ON and AFTER decorators", async () => {
    const repo = new TestRepo();
    await repo.create(new T({ id: "5", name: "to-delete" }));
    const res = await repo.delete("5");
    expect(res).toBeInstanceOf(T);
    const pairs = enforceSpy.mock.calls.map((c) => [c[3], c[4]]);
    expect(pairs).toEqual(
      expect.arrayContaining([
        [OperationKeys.DELETE, OperationKeys.ON],
        [OperationKeys.DELETE, OperationKeys.AFTER],
      ])
    );
  });
});
