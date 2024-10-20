import { TestRamRepository } from "./testRepositories";
import { TestModel } from "./TestModel";
import { IRepository } from "../../src/interfaces/IRepository";
import { ValidationError } from "../../src";

describe("Update Validation", () => {
  it("Validates Properly when provided with the previous version", () => {
    const tm1 = new TestModel({
      name: "test",
      address: "testtttt",
    });

    let errs = tm1.hasErrors("id", "createdOn", "updatedOn");
    expect(errs).toBeUndefined();

    const tm2 = new TestModel({
      name: "test",
      address: "tttttttesst",
    });

    errs = tm2.hasErrors(tm1, "id", "createdOn", "updatedOn");
    expect(errs).toBeUndefined();

    const tm3 = new TestModel({
      name: "testasdasd",
      address: "tttttttesst",
    });

    errs = tm3.hasErrors(tm2, "id", "createdOn", "updatedOn");
    expect(errs).toBeDefined();
  });

  it("denies validation when required", async () => {
    const tm = new TestModel({
      id: Date.now().toString(),
      name: "test",
      address: "testtttt",
    });

    const repo: IRepository<TestModel> = new TestRamRepository();

    const newTm = await repo.create(new TestModel(tm));

    let errs = newTm.hasErrors();
    expect(errs).toBeUndefined();

    const toUpdate = new TestModel(
      Object.assign({}, newTm, {
        address: "tttttttesst",
      })
    );

    errs = toUpdate.hasErrors(newTm, "updatedOn");
    expect(errs).toBeUndefined();

    const otherNewTm = await repo.update(toUpdate);
    errs = otherNewTm.hasErrors(toUpdate);
    expect(errs).toBeUndefined();

    const toFailUpdate = new TestModel(
      Object.assign({}, otherNewTm, {
        name: "tttttttesst",
      })
    );

    errs = otherNewTm.hasErrors(toFailUpdate);
    expect(errs).toBeDefined();

    await expect(() =>
      repo.update(new TestModel(toFailUpdate))
    ).rejects.toThrowError(ValidationError);
  });
});
