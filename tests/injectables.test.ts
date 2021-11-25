// @ts-ignore
import {TestModelAsync} from "./TestModel";
// @ts-ignore
import {TestRamRepository} from "./TestRepository";
import {AsyncRepository, getInjectablesRegistry} from "../src";

describe(`Injectables`, function(){

    it.only(`Instantiates Properly`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        expect(testRepository).not.toBeNull();
        expect(testRepository.constructor.name).toEqual(TestRamRepository.name);
    });

    it(`Registers itself onto the registry upon Instantiation`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        // @ts-ignore
        const repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(testRepository.constructor.name);
        expect(testRepository).toEqual(repo);
    });

    it(`Injects the class into the registry on Model build`, function(){
        const testModel = new TestModelAsync();

    });
});