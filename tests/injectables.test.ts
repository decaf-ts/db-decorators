// @ts-ignore
import {TestModelAsync} from "./TestModel";
// @ts-ignore
import {KeylessTestRamRepository, TestRamRepository} from "./TestRepository";
import {AsyncRepository, getInjectablesRegistry, inject} from "../src";

describe(`Injectables`, function(){

    it(`Instantiates Properly`, function(){
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

    it(`Handles more than one Injectable`, function(){
        const testRepository1: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const testRepository2: AsyncRepository<TestModelAsync> = new KeylessTestRamRepository();
        // @ts-ignore
        let repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(testRepository1.constructor.name);
        expect(testRepository1).toEqual(repo);

        // @ts-ignore
        repo = getInjectablesRegistry().get(testRepository2.constructor.name);
        expect(testRepository2).toEqual(repo);
    });

    it(`Responds to force`, function(){
        const testRepository1: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const testRepository2: AsyncRepository<TestModelAsync> = new TestRamRepository();
        // @ts-ignore
        let repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(testRepository1.constructor.name);
        expect(testRepository1).toBe(repo);

        // @ts-ignore
        repo = getInjectablesRegistry().get(testRepository2.constructor.name);
        expect(testRepository2).toBe(repo);
    });

    it(`Gets Injected Properly`, function(){
        class Controller{

            @inject()
            repo!: TestRamRepository;

            constructor(){
            }
        }

        const testController: Controller = new Controller();

        expect(testController.repo).toBeDefined();

        const repo = getInjectablesRegistry().get("TestRamRepository");
        expect(testController.repo).toEqual(repo);
    });
});