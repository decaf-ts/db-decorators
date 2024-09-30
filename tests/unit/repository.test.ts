import {InheritanceTestModel, TestModel} from "./TestModel";
import {Injectables} from "@decaf-ts/injectable-decorators";
import {IRepository} from "../../src/interfaces/IRepository";
import {InheritanceRamRepository, TestRamRepository} from "./testRepositories";

describe(`Repository`, function () {

  const testModel = new TestModel({
    id: Date.now().toString()
  });

  beforeEach(() => {
    Injectables.reset();
  });

  it(`Instantiates`, function () {
    const testRepository: IRepository<TestModel> = new TestRamRepository();
    expect(testRepository).not.toBeNull();
  });

  it(`Fills Properties Nicely`, async () => {
    const testRepository: IRepository<TestModel> = new TestRamRepository();

    const result = await testRepository.create(testModel)
    expect(result.updatedOn).toBeDefined();
    expect(result.createdOn).toBeDefined();
  });

  it("Supports inheritance", async () => {
    const inheritedModel = new InheritanceTestModel({
      id: Date.now().toString()
    });
    const repo = new InheritanceRamRepository();

    const result = await repo.create(inheritedModel)
    expect(result?.id).toBeDefined();
    expect(result?.updatedOn).toBeDefined();
    expect(result?.createdOn).toBeDefined();
  })
});