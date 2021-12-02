// @ts-ignore
import {TestModelAsync} from "./TestModel";
import {AsyncRepository, Err} from "../src";
// @ts-ignore
import {TestRamRepository} from "./TestRepository";

describe("Update Validation", () => {

    it('Validates Properly when provided with the previous version', () => {
        const tm1 = new TestModelAsync({
            name: "test",
            address: "testtttt"
        });

        let errs = tm1.hasErrors("id", "createdOn", "updatedOn");
        expect(errs).toBeUndefined();

        const tm2 = new TestModelAsync({
            name: "test",
            address: "tttttttesst"
        });

        errs = tm2.hasErrors(tm1, "id", "createdOn", "updatedOn");
        expect(errs).toBeUndefined();

        const tm3 = new TestModelAsync({
            name: "testasdasd",
            address: "tttttttesst"
        });

        errs = tm3.hasErrors(tm2, "id", "createdOn", "updatedOn");
        expect(errs).toBeDefined();

    });

    it('denies validation when required', (callback) => {
        let tm = new TestModelAsync({
            name: "test",
            address: "testtttt"
        });

        const repo: AsyncRepository<TestModelAsync> = new TestRamRepository();

        repo.create(1, new TestModelAsync(tm), (err: Err, newTm: TestModelAsync) => {
            expect(err).toBeUndefined();

            expect(newTm).toBeDefined();

            let errs = newTm.hasErrors();
            expect(errs).toBeUndefined();

            newTm.address = "tttttttesst";

            errs = newTm.hasErrors(tm, "id", "createdOn", "updatedOn");
            expect(errs).toBeUndefined();

            repo.update(1, new TestModelAsync(newTm), (err: Err, otherNewTm: TestModelAsync) => {
                expect(err).toBeUndefined();
                expect(otherNewTm).toBeDefined();
                errs = otherNewTm.hasErrors(newTm);
                expect(errs).toBeUndefined();

                otherNewTm.name = "ttttt";
                errs = newTm.hasErrors(newTm);
                expect(errs).toBeDefined();

                repo.update(1, new TestModelAsync(otherNewTm), (err: Err, otherNewTm: TestModelAsync) => {
                    expect(err).toBeDefined();

                    callback();
                });
            });
        });
    });
});
