import {InheritanceTestModel, TestModel} from "./TestModel";
import {Injectables} from "@decaf-ts/injectable-decorators";
import {IRepository} from "../../src/interfaces/IRepository";
import {RamRepository} from "./RamRepository";
import {InheritanceRamRepository} from "./testRepositories";

describe(`Async Repository`, function () {

  const testModel = new TestModel();

  beforeEach(() => {
    Injectables.reset();
  });

  it(`Instantiates`, function () {
    const testRepository: IRepository<TestModel> = new RamRepository();
    expect(testRepository).not.toBeNull();
  });

  it(`Fills Properties Nicely`, async () => {
    const testRepository: IRepository<TestModel> = new RamRepository();

    const result = await testRepository.create(testModel)
    expect(result.id).toBeDefined();
    expect(result.updatedOn).toBeDefined();
    expect(result.createdOn).toBeDefined();
  });

  it("Supports inheritance", async () => {
    const inheritedModel = new InheritanceTestModel();
    const repo = new InheritanceRamRepository();

    const result = await repo.create(inheritedModel)
    expect(result?.id).toBeDefined();
    expect(result?.updatedOn).toBeDefined();
    expect(result?.createdOn).toBeDefined();
  })
});