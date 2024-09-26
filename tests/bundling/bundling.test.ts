import {UpdateValidationKeys} from "../../src"; // at least one import is needed so the file is considered a module byt jest

describe("Distribution Tests", () => {
    it("reads lib", () => {
        try {
            const {UpdateValidationKeys} = require("../../lib");
            expect(UpdateValidationKeys).toBeDefined();
        } catch (e) {
            expect(e).toBeUndefined();
        }

    })

    it ("reads JS Bundle", () => {
        try {
            const {prefixMethod} = require("../../dist/db_decorators.bundle.js");
            expect(prefixMethod).toBeDefined();
            
        } catch (e) {
            expect(e).toBeUndefined();
        }
    })
})