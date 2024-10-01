import {InheritanceTestModel, TestModel} from "./TestModel";
import {RamRepository} from "./RamRepository";

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