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
    });
});