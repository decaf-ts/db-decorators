import {TestRamRepository} from "./testRepositories";
import {TestModel} from "./TestModel";
import {IRepository} from "../../src/interfaces/IRepository";

describe("Update Validation", () => {

    it('Validates Properly when provided with the previous version', () => {
        const tm1 = new TestModel({
            name: "test",
            address: "testtttt"
        });

        let errs = tm1.hasErrors("id", "createdOn", "updatedOn");
        expect(errs).toBeUndefined();

        const tm2 = new TestModel({
            name: "test",
            address: "tttttttesst"
        });

        errs = tm2.hasErrors(tm1, "id", "createdOn", "updatedOn");
        expect(errs).toBeUndefined();

        const tm3 = new TestModel({
            name: "testasdasd",
            address: "tttttttesst"
        });

        errs = tm3.hasErrors(tm2, "id", "createdOn", "updatedOn");
        expect(errs).toBeDefined();

    });

    it('denies validation when required', async () => {
        let tm = new TestModel({
            name: "test",
            address: "testtttt"
        });

        const repo: IRepository<TestModel> = new TestRamRepository();

        const newTm = await repo.create(new TestModel(tm));

        let errs = newTm.hasErrors();
        expect(errs).toBeUndefined();

        newTm.address = "tttttttesst";

        errs = newTm.hasErrors(tm, "id", "createdOn", "updatedOn");
        expect(errs).toBeUndefined();

        const otherNewTm = await repo.update(new TestModel(newTm));
        errs = otherNewTm.hasErrors(newTm);
        expect(errs).toBeUndefined();

        otherNewTm.name = "ttttt";
        errs = newTm.hasErrors(newTm);
        expect(errs).toBeDefined();

        await repo.update(new TestModel(otherNewTm));
    });
});
