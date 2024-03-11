// @ts-ignore
import {InheritanceTestModel, TestModelAsync} from "./TestModel";
import {
  InheritanceRamRepository,
  KeylessTestRamRepository,
  TestRamRepository
// @ts-ignore
} from "./TestRepository";
import {AsyncRepository, InjectableRegistryImp, setInjectablesRegistry} from "../../src";
import {Err} from "@decaf-ts/logging";

describe(`Async Repository`, function () {

  const testModel = new TestModelAsync();

  beforeEach(() => {
    setInjectablesRegistry(new InjectableRegistryImp());
  });

  it(`Instantiates`, function () {
    const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
    expect(testRepository).not.toBeNull();
  });

  it(`Fills Properties Nicely`, function (testFinished) {
    const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();

    testRepository.create("testModel.id", testModel, (err: Err, result?: TestModelAsync) => {
      expect(err).toBeUndefined();
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBeDefined();
        expect(result.updatedOn).toBeDefined();
        expect(result.createdOn).toBeDefined();
      }
      testFinished();
    });
  });

  it("Supports inheritance", testFinished => {
    const inheritedModel = new InheritanceTestModel();
    const repo = new InheritanceRamRepository();

    repo.create("some key", inheritedModel, (err: Err, result) => {
      expect(err).toBeUndefined();
      expect(result).toBeDefined();
      expect(result?.id).toBeDefined();
      expect(result?.updatedOn).toBeDefined();
      expect(result?.createdOn).toBeDefined();
      testFinished();
    })

  })
});

describe(`Keyless Async Repository`, function () {

  const testModel = new TestModelAsync();

  beforeEach(() => {
    setInjectablesRegistry(new InjectableRegistryImp());
  });

  it(`Instantiates`, function () {
    const testRepository: AsyncRepository<TestModelAsync> = new KeylessTestRamRepository();
    expect(testRepository).not.toBeNull();
  });

  it(`Fills Properties Nicely`, function (testfinished) {
    const testRepository: KeylessTestRamRepository = new KeylessTestRamRepository();

    testRepository.create(testModel, (err: Err, result?: TestModelAsync) => {
      expect(err).toBeUndefined();
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBeDefined();
        expect(result.updatedOn).toBeDefined();
        expect(result.createdOn).toBeDefined();
      }
      testfinished();
    });
  });
});