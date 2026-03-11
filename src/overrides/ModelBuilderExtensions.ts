import "@decaf-ts/decorator-validation";
import type { ModelBuilder } from "@decaf-ts/decorator-validation";
import { ModelBuilder as ModelBuilderImpl } from "@decaf-ts/decorator-validation";
import {
  generated,
  hash,
  composed,
  composedFromKeys,
  version,
  transient,
} from "../model/decorators";

declare module "@decaf-ts/decorator-validation" {
  export interface ModelBuilder<M> {
    generated<N extends keyof M>(attr: N, type?: string): ModelBuilder<M>;
    hash<N extends keyof M>(attr: N): ModelBuilder<M>;
    composedFromKeys<N extends keyof M>(
      attr: N,
      args: string[],
      separator?: string,
      filterEmpty?: boolean | string[],
      hash?: boolean,
      prefix?: string,
      suffix?: string,
      groupsort?: { priority: number }
    ): ModelBuilder<M>;
    composed<N extends keyof M>(
      attr: N,
      args: string[],
      separator?: string,
      filterEmpty?: boolean | string[],
      hash?: boolean,
      prefix?: string,
      suffix?: string,
      groupsort?: { priority: number }
    ): ModelBuilder<M>;
    version<N extends keyof M>(attr: N): ModelBuilder<M>;
    transient<N extends keyof M>(attr: N): ModelBuilder<M>;
  }
}

const builderPrototype = ModelBuilderImpl.prototype as ModelBuilderImpl<any>;

if (!builderPrototype.decorateClass) {
  builderPrototype.decorateClass = function (decorator: ClassDecorator) {
    if (!(this as any)._classDecorators) {
      (this as any)._classDecorators = [];
    }
    (this as any)._classDecorators.push(decorator);
    return this;
  };
}

const ensureAttributeBuilder = (builder: ModelBuilder<any>, attr: any) => {
  const attributes = (builder as any).attributes as Map<any, any> | undefined;
  if (attributes?.has(attr)) return attributes.get(attr);
  return (builder as any).attribute(attr, Object);
};

const applyDecorator = (
  builder: ModelBuilder<any>,
  attr: any,
  decorator: PropertyDecorator
) => {
  ensureAttributeBuilder(builder, attr).decorate(decorator);
  return builder;
};

builderPrototype.generated = function (attr: any, type?: string) {
  return applyDecorator(this, attr, generated(type));
};

builderPrototype.hash = function (attr: any) {
  return applyDecorator(this, attr, hash());
};

builderPrototype.composedFromKeys = function (
  attr: any,
  args: string[],
  separator?: string,
  filterEmpty?: boolean | string[],
  hashValue?: boolean,
  prefix?: string,
  suffix?: string,
  groupsort?: { priority: number }
) {
  return applyDecorator(
    this,
    attr,
    composedFromKeys(
      args,
      separator,
      filterEmpty,
      hashValue,
      prefix,
      suffix,
      groupsort
    )
  );
};

builderPrototype.composed = function (
  attr: any,
  args: string[],
  separator?: string,
  filterEmpty?: boolean | string[],
  hashValue?: boolean,
  prefix?: string,
  suffix?: string,
  groupsort?: { priority: number }
) {
  return applyDecorator(
    this,
    attr,
    composed(
      args,
      separator,
      filterEmpty,
      hashValue,
      prefix,
      suffix,
      groupsort
    )
  );
};

builderPrototype.version = function (attr: any) {
  return applyDecorator(this, attr, version());
};

builderPrototype.transient = function (attr: any) {
  return applyDecorator(this, attr, transient());
};
