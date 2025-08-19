import {
  ConditionalAsync,
  ModelErrorDefinition,
} from "@decaf-ts/decorator-validation";

declare module "@decaf-ts/decorator-validation" {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  declare interface Model<Async extends boolean = false> {
    hasErrors(
      previousVersion?: Model | any,
      ...exclusions: any[]
    ): ConditionalAsync<Async, ModelErrorDefinition | undefined>;
  }
}
