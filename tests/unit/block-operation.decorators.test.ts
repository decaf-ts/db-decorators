import { Metadata } from "@decaf-ts/decoration";
import {
  BlockOperationIf,
  BlockOperations,
} from "../../src/operations/decorators";
import { OperationKeys } from "../../src/operations/constants";
import type { CrudOperations } from "../../src/operations/constants";
import { Context } from "../../src/repository/Context";

type BlockOperationMetadata<C extends Context<any> = Context<any>> = {
  args: unknown[];
  handler: (
    operations: CrudOperations[],
    operation: CrudOperations,
    ...args: any[] | [...any[], C]
  ) => boolean;
};

describe.skip("@BlockOperation decorator", () => {
  const metadataKey = OperationKeys.REFLECT + OperationKeys.BLOCK;

  it("stores the blocked CRUD operations and enforces them through the handler", () => {
    class DecoratedModel {
      @BlockOperations([OperationKeys.CREATE, OperationKeys.DELETE])
      status!: string;
    }

    const meta = Metadata.get(DecoratedModel, metadataKey) as
      | BlockOperationMetadata
      | undefined;

    expect(meta).toBeDefined();
    const metadata = meta as BlockOperationMetadata;

    const [blocked] = metadata.args as [CrudOperations[]];
    expect(blocked).toEqual([OperationKeys.CREATE, OperationKeys.DELETE]);

    expect(metadata.handler(blocked, OperationKeys.CREATE)).toBe(true);
    expect(metadata.handler(blocked, OperationKeys.UPDATE)).toBe(false);
  });

  it("supports custom predicates through BlockOperationIf", () => {
    const predicate = jest.fn<
      (operations: CrudOperations[], operation: CrudOperations) => boolean
    >((_operations, operation) => operation === OperationKeys.UPDATE);

    class CustomGuardedModel {
      @BlockOperationIf(predicate)
      action!: string;
    }

    const meta = Metadata.get(CustomGuardedModel, metadataKey) as
      | BlockOperationMetadata
      | undefined;

    expect(meta).toBeDefined();
    const metadata = meta as BlockOperationMetadata;

    expect(metadata.args).toEqual([]);
    expect(metadata.handler).toBe(predicate);

    const operations: CrudOperations[] = [OperationKeys.CREATE];
    expect(metadata.handler(operations, OperationKeys.UPDATE)).toBe(true);
    expect(predicate).toHaveBeenCalledWith(operations, OperationKeys.UPDATE);
  });
});
