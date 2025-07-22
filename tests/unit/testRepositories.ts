import { InheritanceTestModel, TestModel, UserModel } from "./TestModel";
import { RamRepository } from "./RamRepository";

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
