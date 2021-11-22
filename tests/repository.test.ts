// @ts-ignore
import {TestModelAsync} from "./TestModel";
// @ts-ignore
import {TestRamRepository} from "./TestRepository";
import {AsyncRepository} from "../src";


describe(`Async Repository`, function(){

    const testModel = new TestModelAsync();


    it(`Instantiates`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();
        expect(testRepository).not.toBeNull();
    });

    it(`Fills Properties Nicely`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TestRamRepository();

        testRepository.create(testModel, (err, result) => {

        })
    });
});