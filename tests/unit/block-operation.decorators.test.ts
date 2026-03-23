import { Metadata } from "@decaf-ts/decoration";
import {
  BlockOperationIf,
  BlockOperations,
} from "../../src/operations/decorators";
import {
  BulkCrudOperationKeys,
  OperationKeys,
  BulkOperationBlockTarget,
  BlockOperationDescriptor,
} from "../../src/operations/constants";

describe("@BlockOperations decorator", () => {
  const metadataKey = OperationKeys.REFLECT + OperationKeys.BLOCK;

  it("normalizes targets and filters CRUD/bulk operations", () => {
    class DecoratedModel {
      @BlockOperations([OperationKeys.CREATE, BulkCrudOperationKeys.DELETE_ALL])
      status!: string;
    }

    const metadata = Metadata.get(DecoratedModel, metadataKey);
    expect(metadata).toBeDefined();
    const { handler, args } = metadata as { handler: any; args: any[] };

    const [targets] = args as [unknown[]];
    expect(targets).toEqual([
      { kind: "crud", value: OperationKeys.CREATE },
      { kind: "bulk", value: BulkCrudOperationKeys.DELETE_ALL },
    ]);

    expect(handler(targets, "crud", OperationKeys.CREATE)).toBe(true);
    expect(handler(targets, "crud", OperationKeys.UPDATE)).toBe(false);
    expect(handler(targets, "bulk", BulkCrudOperationKeys.DELETE_ALL)).toBe(true);
    expect(handler(targets, "bulk", BulkCrudOperationKeys.CREATE_ALL)).toBe(false);
  });

  it("invokes custom predicates with the new signature", () => {
    const predicate = jest.fn((targets, kind) => kind === "statement");

    class StatementModel {
      @BlockOperationIf(predicate)
      action!: string;
    }

    const metadata = Metadata.get(StatementModel, metadataKey) as {
      handler: any;
      args: any[];
    };

    expect(metadata).toBeDefined();
    expect(metadata.args).toEqual([]);

    const captured = metadata.handler([], "statement", "listBy");
    expect(captured).toBe(true);
    expect(predicate).toHaveBeenCalledWith([], "statement", "listBy");
  });

  it("allows blocking every bulk operation via the block-all target", () => {
    class BulkModel {
      @BlockOperations(BulkOperationBlockTarget.ALL)
      status!: string;
    }

    const metadata = Metadata.get(BulkModel, metadataKey) as {
      handler: any;
      args: any[];
    };

    expect(metadata).toBeDefined();
    const [targets] = metadata.args as [BlockOperationDescriptor[]];

    expect(targets).toEqual([
      { kind: "bulk", value: BulkOperationBlockTarget.ALL },
    ]);

    expect(
      metadata.handler(targets, "bulk", BulkCrudOperationKeys.CREATE_ALL)
    ).toBe(true);
    expect(
      metadata.handler(targets, "bulk", BulkCrudOperationKeys.DELETE_ALL)
    ).toBe(true);
  });
});
