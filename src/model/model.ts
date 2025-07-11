import type { ModelErrorDefinition } from "@decaf-ts/decorator-validation";

declare module "@decaf-ts/decorator-validation" {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  declare interface Model {
    hasErrors(
      previousVersion?: Model | any,
      ...exclusions: any[]
    ): ModelErrorDefinition | undefined;
  }
}
