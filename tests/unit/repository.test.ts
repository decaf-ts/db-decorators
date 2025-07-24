import { InheritanceTestModel, TestModel, UserModel } from "./TestModel";
import { Injectables } from "@decaf-ts/injectable-decorators";
import { IRepository } from "../../src";
import {
  InheritanceRamRepository,
  TestRamRepository,
  UserRamRepository,
} from "./testRepositories";

describe(`Repository`, function () {
  const testModel = new TestModel({
    id: Date.now().toString(),
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

    const result = await testRepository.create(testModel);
    expect(result.updatedOn).toBeDefined();
    expect(result.createdOn).toBeDefined();
  });

  it("should supports inheritance", async () => {
    const inheritedModel = new InheritanceTestModel({
      id: Date.now().toString(),
    });
    const repo = new InheritanceRamRepository();

    const result = await repo.create(inheritedModel);
    expect(result?.id).toBeDefined();
    expect(result?.updatedOn).toBeDefined();
    expect(result?.createdOn).toBeDefined();
  });

  it("should support submodels", async () => {
    const repo = new UserRamRepository();

    const address = {
      street: "Main St",
      country: "US",
    };

    const user = new UserModel({
      id: Date.now().toString(),
      documentId: 10,
      address: address,
    });

    const result = await repo.create(user);
    expect(result?.id).toBeDefined();
    expect(result?.documentId).toEqual(10);
    expect(result?.address).toBeDefined();
    expect(result?.address).toEqual(address);
    expect(result?.updatedOn).toBeDefined();
    expect(result?.createdOn).toBeDefined();
  });

  it("should support async decorators", async () => {
    const repo = new UserRamRepository();

    const address = {
      street: "Main St",
      country: "US",
    };

    const user = new UserModel({
      id: Date.now().toString(),
      documentId: 1000,
      address: address,
    });

    await expect(repo.create(user)).rejects.toThrow("Invalid value");

    user.documentId = 20;
    const result = await repo.create(user);
    expect(result?.id).toBeDefined();
    expect(result?.address).toBeDefined();
    expect(result?.address).toEqual(address);
    expect(result?.documentId).toEqual(20);
    expect(result?.updatedOn).toBeDefined();
    expect(result?.createdOn).toBeDefined();
  });
});
