// @ts-ignore
import {TestModelAsync} from "./TestModel";


describe(`DBModel Async`, function(){
    it(`Instantiates`, function(){
        const testModel = new TestModelAsync();
        expect(testModel).not.toBeNull();
    });

    it(`Fails Empty Validation`, function(){
        const testModel = new TestModelAsync();
        expect(testModel).not.toBeNull();
        const errors = testModel.hasErrors();
        expect(errors).not.toBeNull();
        if (errors){
            expect(new Set(Object.keys(errors)).size).toBe(3); // how many properties have errors
            expect(Object.values(errors).length).toBe(3); // how many total errors
        }
    });

    it(`Fails timestamp date validation`, function(){
        const testModel = new TestModelAsync({
            id: 1
        });

        expect(testModel).not.toBeNull();

        // @ts-ignore
        testModel.updatedOn = "test";
        // @ts-ignore
        testModel.createdOn = "test";

        const errors = testModel.hasErrors();
        expect(errors).not.toBeNull();
        if (errors){
            expect(new Set(Object.keys(errors)).size).toBe(2); // how many properties have errors
            expect(Object.values(errors).length).toBe(2); // how many total errors
        }
    });
});