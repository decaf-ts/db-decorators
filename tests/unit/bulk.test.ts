import {TestRamRepository} from "./testRepositories";
import {TestModel} from "./TestModel";
import {NotFoundError} from "../../src";

describe("bulk CRUD", () => {
  const repo = new TestRamRepository()

  const models = [1,2,3,4,5,6].map(el => new TestModel({
    id: el,
    name: "test_name" + el,
    address: "test_address" + el
  }))

  let created: TestModel[]
  let updated: TestModel[]

  it("creates", async () => {
    created = await repo.createAll(models);
    expect(created).toBeDefined();
    expect(Array.isArray(created)).toEqual(true);
    expect(created.every(el => el instanceof TestModel)).toEqual(true)
    expect(created.every(el => !el.hasErrors())).toEqual(true)
  })

  it("reads", async () => {
    const ids = created.map(c => c.id) as string[]
    const read = await repo.readAll(ids);
    expect(read).toBeDefined();
    expect(Array.isArray(read)).toEqual(true);
    expect(read.every(el => el instanceof TestModel)).toEqual(true)
    expect(read.every(el => !el.hasErrors())).toEqual(true)
    expect(read.every((el, i) => el.equals(created[i]))).toEqual(true)
  })

  it("updates", async () => {
    const toUpdate = created.map((c, i) => {
      return new TestModel({
        id: c.id as string,
        address: "updated_address" + i
      })
    })
    updated = await repo.updateAll(toUpdate);
    expect(updated).toBeDefined();
    expect(Array.isArray(updated)).toEqual(true);
    expect(updated.every(el => el instanceof TestModel)).toEqual(true)
    expect(updated.every(el => !el.hasErrors())).toEqual(true)
    expect(updated.every((el, i) => !el.equals(created[i]))).toEqual(true)
  })

  it("deletes", async () => {
    const ids = created.map(c => c.id) as string[]
    const deleted = await repo.deleteAll(ids);
    expect(deleted).toBeDefined();
    expect(Array.isArray(deleted)).toEqual(true);
    expect(deleted.every(el => el instanceof TestModel)).toEqual(true)
    expect(deleted.every(el => !el.hasErrors())).toEqual(true)
    expect(deleted.every((el, i) => el.equals(updated[i]))).toEqual(true);
    for(const k in created.map(c => c.id)){
      await expect(repo.read(k)).rejects.toThrowError(NotFoundError);
    }
  })
})