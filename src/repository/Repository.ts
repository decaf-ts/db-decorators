import { enforceDBDecorators, reduceErrorsToPrint } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError, ValidationError } from "./errors";
import { BaseRepository } from "./BaseRepository";
import { Model } from "@decaf-ts/decorator-validation";
import { Context } from "./Context";
import { PrimaryKeyType, RepositoryFlags } from "./types";
import { Constructor } from "@decaf-ts/decoration";
import { IRepository } from "../interfaces/index";

/**
 * @description Concrete repository implementation with validation support.
 * @summary The Repository class extends BaseRepository to provide additional validation
 * functionality. It overrides prefix methods to perform model validation before database
 * operations and throws ValidationError when validation fails.
 * @template M - The model type extending Model
 * @template F - The repository flags type, defaults to RepositoryFlags
 * @template C - The context type, defaults to Context<F>
 * @class Repository
 * @example
 * class UserModel extends Model {
 *   @id()
 *   id: string;
 *
 *   @required()
 *   @minLength(3)
 *   name: string;
 * }
 *
 * class UserRepository extends Repository<UserModel> {
 *   constructor() {
 *     super(UserModel);
 *   }
 *
 *   async create(model: UserModel): Promise<UserModel> {
 *     // Implementation with automatic validation
 *     return model;
 *   }
 * }
 *
 * // Using the repository
 * const repo = new UserRepository();
 * try {
 *   const user = await repo.create({ name: 'Jo' }); // Will throw ValidationError
 * } catch (error) {
 *   console.error(error); // ValidationError: name must be at least 3 characters
 * }
 */
export abstract class Repository<
  M extends Model<boolean>,
  C extends Context<any> = Context<RepositoryFlags>,
> extends BaseRepository<M, C> {
  protected constructor(clazz?: Constructor<M>) {
    super(clazz);
  }

  /**
   * @description Prepares a model for creation with validation.
   * @summary Overrides the base createPrefix method to add validation checks.
   * Creates a context, instantiates a new model, enforces decorators, and validates
   * the model before allowing creation to proceed.
   * @param {M} model - The model instance to prepare for creation
   * @param {any[]} args - Additional arguments for the create operation
   * @return A promise that resolves to an array containing the validated model and context arguments
   * @throws {ValidationError} If the model fails validation
   */
  protected override async createPrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.CREATE,
      this.class,
      args
    );
    model = new this.class(model);
    await enforceDBDecorators<M, IRepository<M, C>, any>(
      this,
      contextArgs.context,
      model,
      OperationKeys.CREATE,
      OperationKeys.ON
    );

    const errors = await Promise.resolve(model.hasErrors());
    if (errors) throw new ValidationError(errors.toString());

    return [model, ...contextArgs.args];
  }

  /**
   * @description Prepares multiple models for creation with validation.
   * @summary Overrides the base createAllPrefix method to add validation checks for multiple models.
   * Creates a context, instantiates new models, enforces decorators, and validates
   * each model before allowing creation to proceed. Collects validation errors from all models.
   * @param {M[]} models - The array of model instances to prepare for creation
   * @param {any[]} args - Additional arguments for the create operation
   * @return {Promise<any[]>} A promise that resolves to an array containing the validated models and context arguments
   * @throws {ValidationError} If any model fails validation, with details about which models failed
   */
  protected override async createAllPrefix(
    models: M[],
    ...args: any[]
  ): Promise<[M[], ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.CREATE,
      this.class,
      args
    );
    await Promise.all(
      models.map(async (m) => {
        m = new this.class(m);
        await enforceDBDecorators<M, IRepository<M, C>, any>(
          this,
          contextArgs.context,
          m,
          OperationKeys.CREATE,
          OperationKeys.ON
        );
        return m;
      })
    );

    const modelsValidation = await Promise.all(
      models.map((m) => Promise.resolve(m.hasErrors()))
    );

    const errors = reduceErrorsToPrint(modelsValidation);

    if (errors) throw new ValidationError(errors);
    return [models, ...contextArgs.args];
  }

  /**
   * @description Prepares a model for update with validation.
   * @summary Overrides the base updatePrefix method to add validation checks.
   * Creates a context, validates the primary key, retrieves the existing model,
   * merges the old and new models, enforces decorators, and validates the model
   * before allowing the update to proceed.
   * @param {M} model - The model instance to prepare for update
   * @param {any[]} args - Additional arguments for the update operation
   * @return A promise that resolves to an array containing the validated model and context arguments
   * @throws {InternalError} If the model doesn't have a primary key value
   * @throws {ValidationError} If the model fails validation
   */
  protected override async updatePrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...args: any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.UPDATE,
      this.class,
      args
    );
    const pk = (model as any)[this.pk];
    if (!pk)
      throw new InternalError(
        `No value for the Id is defined under the property ${this.pk as string}`
      );

    const oldModel: M = await this.read(pk);

    model = Model.merge(oldModel, model, this.class);

    await enforceDBDecorators<M, IRepository<M, C>, any>(
      this,
      contextArgs.context,
      model,
      OperationKeys.UPDATE,
      OperationKeys.ON,
      oldModel
    );

    const errors = await Promise.resolve(model.hasErrors(oldModel as any));
    if (errors) throw new ValidationError(errors.toString());
    return [model, ...contextArgs.args];
  }

  /**
   * @description Prepares multiple models for update with validation.
   * @summary Overrides the base updateAllPrefix method to add validation checks for multiple models.
   * Creates a context, validates primary keys, retrieves existing models, merges old and new models,
   * enforces decorators, and validates each model before allowing updates to proceed.
   * Collects validation errors from all models.
   * @param {M[]} models - The array of model instances to prepare for update
   * @param {any[]} args - Additional arguments for the update operation
   * @return A promise that resolves to an array containing the validated models and context arguments
   * @throws {InternalError} If any model doesn't have a primary key value
   * @throws {ValidationError} If any model fails validation, with details about which models failed
   */
  protected override async updateAllPrefix(
    models: M[],
    ...args: any[]
  ): Promise<[M[], ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.UPDATE,
      this.class,
      args
    );
    const ids = models.map((m) => {
      const id = m[this.pk];
      if (typeof id === "undefined")
        throw new InternalError(
          `No value for the Id is defined under the property ${this.pk as string}`
        );
      return id as string;
    });
    const oldModels: M[] = await this.readAll(ids, ...contextArgs.args);
    models = models.map((m, i) => Model.merge(oldModels[i], m, this.class));
    await Promise.all(
      models.map((m, i) =>
        enforceDBDecorators<M, IRepository<M, C>, any>(
          this,
          contextArgs.context,
          m,
          OperationKeys.UPDATE,
          OperationKeys.ON,
          oldModels[i]
        )
      )
    );

    const modelsValidation = await Promise.all(
      models.map((m, i) => Promise.resolve(m.hasErrors(oldModels[i] as any)))
    );

    const errors = reduceErrorsToPrint(modelsValidation);

    if (errors) throw new ValidationError(errors);
    return [models, ...contextArgs.args];
  }

  protected override async readPrefix(
    key: PrimaryKeyType,
    ...args: any[]
  ): Promise<[PrimaryKeyType, ...any[], C]> {
    return super.readPrefix(key, ...args);
  }

  protected override async readAllPrefix(
    keys: PrimaryKeyType[],
    ...args: any[]
  ): Promise<[PrimaryKeyType[], ...any[], C]> {
    return super.readAllPrefix(keys, ...args);
  }

  protected override async deleteAllPrefix(
    keys: PrimaryKeyType[],
    ...args: any[]
  ): Promise<[PrimaryKeyType[], ...any[], C]> {
    return super.deleteAllPrefix(keys, ...args);
  }
}
