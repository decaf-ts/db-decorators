// @ts-ignore
import {TestModelAsync} from "./TestModel";
// @ts-ignore
import {KeylessTestRamRepository, TestRamRepository} from "./TestRepository";
import {AsyncRepository, getInjectablesRegistry, inject, injectable} from "../../src";

describe(`Injectables`, function(){

    it(`Instantiates Properly`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        expect(testRepository).not.toBeNull();
        expect(testRepository.constructor.name).toEqual(TestRamRepository.name);
    });

    it(`Registers itself onto the registry upon Instantiation`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(testRepository.constructor.name) as AsyncRepository<TestModelAsync>;;
        expect(testRepository).toEqual(repo);
    });

    it(`Handles more than one Injectable`, function(){
        const testRepository1: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const testRepository2: AsyncRepository<TestModelAsync> = new KeylessTestRamRepository();
        let repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(testRepository1.constructor.name) as AsyncRepository<TestModelAsync>;
        expect(testRepository1).toEqual(repo);

        repo = getInjectablesRegistry().get(testRepository2.constructor.name) as AsyncRepository<TestModelAsync>;
        expect(testRepository2).toEqual(repo);
    });

    it(`Responds to force`, function(){
        const testRepository1: AsyncRepository<TestModelAsync> = new TestRamRepository();
        const testRepository2: AsyncRepository<TestModelAsync> = new TestRamRepository();
        let repo: AsyncRepository<TestModelAsync> = getInjectablesRegistry().get(testRepository1.constructor.name) as AsyncRepository<TestModelAsync>;
        expect(testRepository1).toBe(repo);

        repo = getInjectablesRegistry().get(testRepository2.constructor.name) as AsyncRepository<TestModelAsync>;;
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

    it(`Gets transformer Properly`, function(){

        const transform = function(el: any){
            return "1";
        }

        class Controller{

            @inject(undefined, transform)
            repo!: TestRamRepository;

            constructor(){
            }
        }

        const testController: Controller = new Controller();

        expect(testController.repo).toBeDefined();

        const repo = getInjectablesRegistry().get("TestRamRepository");
        expect(testController.repo).not.toEqual(repo);
        expect(testController.repo).toEqual("1");
    });

    it(`Responds to category as an injectable`, function(){

        class AAA {
            protected a: string = "aaa"
        }

        console.log("here")

        @injectable("AAA")
        class BBB extends AAA{
            protected b: string = "bbb"
        }

        const b = new BBB();

        class Controller{

            @inject()
            repo!: AAA;

            constructor(){
            }
        }

        const testController: Controller = new Controller();

        expect(testController.repo).toBeDefined();

        expect(testController.repo).toBe(b);
    });

    it(`Responds to category while injected`, function(){

        class AAA {
            protected a: string = "aaa"
        }

        console.log("here")

        @injectable("AAA")
        class BBB extends AAA{
            protected b: string = "bbb"
        }

        const b = new BBB();

        class Controller{

            @inject("AAA")
            repo!: BBB;

            constructor(){
            }
        }

        const testController: Controller = new Controller();

        expect(testController.repo).toBeDefined();

        expect(testController.repo).toBe(b);
    });
});