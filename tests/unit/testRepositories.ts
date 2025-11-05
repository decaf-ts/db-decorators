import { InheritanceTestModel, TestModel, UserModel } from "./TestModel";
import { RamRepository } from "./RamRepository";
import { timestamp } from "../../src/validation/decorators";
import { DBOperations } from "../../src/operations/constants";

export class TestRamRepository extends RamRepository<TestModel> {
  constructor() {
    super(TestModel);
  }
}

export class InheritanceRamRepository extends RamRepository<InheritanceTestModel> {
  constructor() {
    super(InheritanceTestModel);
  }
}

export class UserRamRepository extends RamRepository<UserModel> {
  constructor() {
    super(UserModel);
  }
}
