import { inject, injectable } from "@decaf-ts/injectable-decorators";
import { metadata } from "@decaf-ts/reflection";
import { getDBKey } from "../model/decorators";
import { DBKeys } from "../model/constants";
import { Constructor } from "@decaf-ts/decorator-validation";
import { DBModel } from "../model/DBModel";
import { IRepository } from "../interfaces/IRepository";
import { InternalError } from "./errors";

export function repository<T extends DBModel>(
  model: Constructor<T>,
  nameOverride?: string,
) {
  return (original: object, propertyKey?: string) => {
    if (propertyKey) {
      const injectableName: string | undefined = Reflect.getMetadata(
        getDBKey(DBKeys.REPOSITORY),
        model,
      );
      if (!injectableName)
        throw new InternalError(`Could not find repository for ${model.name}`);
      return inject(injectableName)(original, propertyKey);
    }

    metadata(
      getDBKey(DBKeys.REPOSITORY),
      nameOverride || original.constructor.name,
    )(model);
    injectable(nameOverride, true, (instance: IRepository<T>) => {
      Object.defineProperty(instance, DBKeys.CLASS, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: model,
      });
    });
  };
}
