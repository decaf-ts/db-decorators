import {
  Constructor,
  Model,
  ModelArg,
  ModelErrorDefinition,
} from "@decaf-ts/decorator-validation";
import { IRepository } from "../interfaces/IRepository";
import { getDBKey } from "./decorators";
import { DBKeys } from "./constants";
import { InternalError, NotFoundError } from "../repository/errors";
import { Injectables } from "@decaf-ts/injectable-decorators";
import { validateCompare } from "./validation";

/**
 * @summary Abstract class representing a Validatable DBModel object
 *
 * @param {ModelArg} [arg]
 *
 * @see Model
 *
 * @class DBModel
 * @abstract
 * @extends Model
 *
 * @category Model
 */
export abstract class DBModel extends Model {
  protected constructor(arg?: ModelArg<DBModel>) {
    super(arg);
  }

  /**
   * @param {DBModel | any} [previousVersion] validates an update via the {@link DBModel} decorators
   * @param {any[]} [exclusions] {@see Model#hasErrors}
   * @return {ModelErrorDefinition | undefined}
   */
  hasErrors(
    previousVersion?: DBModel | any,
    ...exclusions: any[]
  ): ModelErrorDefinition | undefined {
    if (previousVersion && !(previousVersion instanceof DBModel)) {
      exclusions.unshift(previousVersion);
      previousVersion = undefined;
    }

    const errs = super.hasErrors(...exclusions);
    if (errs || !previousVersion) return errs;

    return validateCompare(previousVersion, this, ...exclusions);
  }

  static findRepository<V extends DBModel>(
    model: Constructor<V>,
  ): IRepository<V> {
    const injectableName: string | undefined = Reflect.getMetadata(
      getDBKey(DBKeys.REPOSITORY),
      model,
    );
    if (!injectableName)
      throw new InternalError(
        `Could not find any registered repositories for ${model.name}`,
      );
    const repo = Injectables.get(injectableName) as IRepository<V> | undefined;
    if (!repo)
      throw new NotFoundError(`Could not find repository for ${model.name}`);
    return repo;
  }
}
