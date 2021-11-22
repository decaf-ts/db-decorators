// @ts-ignore
import {TestModelAsync} from "./TestModel";
// @ts-ignore
import {TestRamRepository} from "./TestRepository";
import {AsyncRepository, Err} from "../src";


describe(`Async Repository`, function(){

    const testModel = new TestModelAsync();


    it(`Instantiates`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        expect(testRepository).not.toBeNull();
    });

    it(`Fills Properties Nicely`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();

        testRepository.create(undefined, testModel, (err: Err, result: TestModelAsync) => {
            expect(err).toBeUndefined();
            expect(result).toBeDefined();
            expect(result.id).not.toBeUndefined();
            expect(result.updatedOn).not.toBeUndefined();
            expect(result.createdOn).not.toBeUndefined();
        });
    });
});