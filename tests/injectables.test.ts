// @ts-ignore
import {TestModelAsync} from "./TestModel";
// @ts-ignore
import {KeylessTestRamRepository, TestRamRepository} from "./TestRepository";
import {AsyncRepository, getInjectablesRegistry} from "../src";
import {RepositoryKeys} from "../src/repository/constants";

describe(`Injectables`, function(){

    it(`Instantiates Properly`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        expect(testRepository).not.toBeNull();
        expect(testRepository.constructor.name).toEqual(TestRamRepository.name);
    });

    it(`Registers itself onto the registry upon Instantiation`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        // @ts-ignore
        const repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(RepositoryKeys.REPO, testRepository.constructor.name);
        expect(testRepository).toEqual(repo);
    });

    it(`Handles more than one Injectable per category`, function(){
        const testRepository1: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const testRepository2: AsyncRepository<TestModelAsync> = new KeylessTestRamRepository();
        // @ts-ignore
        let repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(RepositoryKeys.REPO, testRepository1.constructor.name);
        expect(testRepository1).toEqual(repo);

        // @ts-ignore
        repo = getInjectablesRegistry().get(RepositoryKeys.REPO, testRepository2.constructor.name);
        expect(testRepository2).toEqual(repo);
    });

    it(`Responds to force`, function(){
        const testRepository1: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const testRepository2: AsyncRepository<TestModelAsync> = new TestRamRepository();
        // @ts-ignore
        let repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(RepositoryKeys.REPO, testRepository1.constructor.name);
        expect(testRepository1).toEqual(repo);

        // @ts-ignore
        repo = getInjectablesRegistry().get(RepositoryKeys.REPO, testRepository2.constructor.name);
        expect(testRepository2).toEqual(repo);
    });
});