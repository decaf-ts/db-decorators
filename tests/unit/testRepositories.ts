import {InheritanceTestModel, TestModel} from "./TestModel";
import {repository} from "../../src/repository/decorators";
import {RamRepository} from "./RamRepository";

@repository(TestModel)
export class TestRamRepository extends RamRepository<TestModel> {
  constructor() {
    super();
  }
}

@repository(InheritanceTestModel)
export class InheritanceRamRepository extends RamRepository<InheritanceTestModel> {
  constructor() {
    super();
  }
}