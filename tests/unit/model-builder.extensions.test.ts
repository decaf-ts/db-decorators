import "../../src/overrides";
import { Metadata } from "@decaf-ts/decoration";
import { Model, ModelBuilder } from "@decaf-ts/decorator-validation";
import { DBKeys } from "../../src/model/constants";

describe("db-decorators ModelBuilder extensions", () => {
  it("registers persistence metadata via builder helpers", () => {
    const builder = ModelBuilder.builder();
    builder.setName("BuilderDecoratedModel");

    builder.string("uuid");
    builder.string("secret");
    builder.string("firstName");
    builder.string("lastName");
    builder.string("composedKeys");
    builder.string("composedValues");
    builder.string("version");
    builder.string("transient");

    builder.generated("uuid", "uuid");
    builder.hash("secret");
    builder.composedFromKeys("composedKeys", ["firstName", "lastName"]);
    builder.composed("composedValues", ["firstName", "lastName"], "-");
    builder.version("version");
    builder.transient("transient");

    const Dynamic = builder.build();

    expect(Model.generated(Dynamic, "uuid")).toBe(true);
    expect(Metadata.get(Dynamic, DBKeys.HASH)).toBeDefined();
    expect(Model.composed(Dynamic, "composedKeys")).toBeDefined();
    expect(Model.composed(Dynamic, "composedValues")).toBeDefined();
    expect(
      Metadata.get(Dynamic, Metadata.key(DBKeys.VERSION, "version"))
    ).toBeDefined();
    expect(
      Metadata.get(Dynamic, Metadata.key(DBKeys.TRANSIENT, "transient"))
    ).toBeDefined();
  });
});
