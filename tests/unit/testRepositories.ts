import { InheritanceTestModel, TestModel, UserModel } from "./TestModel";
import { RamRepository } from "./RamRepository";
import { timestamp } from "../../src/validation/decorators";
import { DBOperations } from "../../src/operations/constants";

export class TestRamRepository extends RamRepository<TestModel> {
  @timestamp(DBOperations.UPDATE)
  updatedOn!: Date;
  @timestamp(DBOperations.CREATE)
  createdOn!: Date;
  constructor() {
    super(TestModel);
  }
}

export class InheritanceRamRepository extends RamRepository<InheritanceTestModel> {
  @timestamp(DBOperations.UPDATE)
  updatedOn!: Date;
  @timestamp(DBOperations.CREATE)
  createdOn!: Date;
  constructor() {
    super(InheritanceTestModel);
  }
}

export class UserRamRepository extends RamRepository<UserModel> {
  @timestamp(DBOperations.UPDATE)
  updatedOn!: Date;
  @timestamp(DBOperations.CREATE)
  createdOn!: Date;
  constructor() {
    super(UserModel);
  }
}
