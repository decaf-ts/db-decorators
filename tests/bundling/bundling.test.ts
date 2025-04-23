import { Dirent } from "fs"; // at least one import is needed so the file is considered a module byt jest

describe("Distribution Tests", () => {
  it("reads lib", () => {
    try {
      const { UpdateValidationKeys } = require("../../lib/index.cjs");
      expect(UpdateValidationKeys).toBeDefined();
    } catch (e) {
      expect(e).toBeUndefined();
    }
  });

  it("reads JS Bundle", () => {
    try {
      let distFile: Dirent[];
      try {
        distFile = require("fs")
          .readdirSync(require("path").join(process.cwd(), "dist"), {
            withFileTypes: true,
          })
          .filter((d: Dirent) => d.isFile() && !d.name.endsWith("esm.js"));
      } catch (e: unknown) {
        throw new Error("Error reading JS bundle: " + e);
      }

      if (distFile.length === 0)
        throw new Error("There should only be a js file in directory");
      const { prefixMethod } = require(`../../dist/${distFile[0].name}`);
      expect(prefixMethod).toBeDefined();
    } catch (e) {
      expect(e).toBeUndefined();
    }
  });
});
