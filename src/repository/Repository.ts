import "../overrides";
import { IRepository } from "../interfaces/IRepository";
import { Model } from "@decaf-ts/decorator-validation";
import { ContextArgs, enforceDBDecorators, reduceErrorsToPrint } from "./utils";
import { OperationKeys } from "../operations/constants";
import { InternalError, ValidationError } from "./errors";
import {
  wrapMethodWithContext,
  wrapMethodWithContextForUpdate,
} from "./wrappers";
import { Context } from "./Context";
import { PrimaryKeyType, RepositoryFlags } from "./types";
import { Constructor } from "@decaf-ts/decoration";

/**
 * @description Base repository implementation providing CRUD operations for models.
 * @summary The BaseRepository class serves as a foundation for repository implementations, providing
 * abstract and concrete methods for creating, reading, updating, and deleting model instances.
 * It handles operation lifecycles including prefix and suffix operations, and enforces decorators.
 * @template M - The model type extending Model
 * @template F - The repository flags type, defaults to RepositoryFlags
 * @template C - The context type, defaults to Context<F>
 * @param {Constructor<M>} clazz - The constructor for the model class
 * @class Repository
 * @example
 * class UserModel extends Model {
 *   @id()
 *   id: string;
 *
 *   @required()
 *   name: string;
 * }
 *
 * class UserRepository extends BaseRepository<UserModel> {
 *   constructor() {
 *     super(UserModel);
 *   }
 *
 *   async create(model: UserModel): Promise<UserModel> {
 *     // Implementation
 *     return model;
 *   }
 *
 *   async read(key: string): Promise<UserModel> {
 *     // Implementation
 *     return new UserModel({ id: key, name: 'User' });
 *   }
 *
 *   async update(model: UserModel): Promise<UserModel> {
 *     // Implementation
 *     return model;
 *   }
 *
 *   async delete(key: string): Promise<UserModel> {
 *     // Implementation
 *     const model = await this.read(key);
 *     return model;
 *   }
 * }
 *
 * @mermaid
 * sequenceDiagram
 *   participant C as Client
 *   participant R as Repository
 *   participant P as Prefix Methods
 *   participant D as Database
 *   participant S as Suffix Methods
 *   participant V as Validators/Decorators
 *
 *   Note over C,V: Create Operation
 *   C->>R: create(model)
 *   R->>P: createPrefix(model)
 *   P->>V: enforceDBDecorators(ON)
 *   P->>D: Database operation
 *   D->>S: createSuffix(model)
 *   S->>V: enforceDBDecorators(AFTER)
 *   S->>C: Return model
 *
 *   Note over C,V: Read Operation
 *   C->>R: read(key)
 *   R->>P: readPrefix(key)
 *   P->>V: enforceDBDecorators(ON)
 *   P->>D: Database operation
 *   D->>S: readSuffix(model)
 *   S->>V: enforceDBDecorators(AFTER)
 *   S->>C: Return model
 *
 *   Note over C,V: Update Operation
 *   C->>R: update(model)
 *   R->>P: updatePrefix(model)
 *   P->>V: enforceDBDecorators(ON)
 *   P->>D: Database operation
 *   D->>S: updateSuffix(model)
 *   S->>V: enforceDBDecorators(AFTER)
 *   S->>C: Return model
 *
 *   Note over C,V: Delete Operation
 *   C->>R: delete(key)
 *   R->>P: deletePrefix(key)
 *   P->>V: enforceDBDecorators(ON)
 *   P->>D: Database operation
 *   D->>S: deleteSuffix(model)
 *   S->>V: enforceDBDecorators(AFTER)
 *   S->>C: Return model
 */
export abstract class Repository<
  M extends Model<boolean>,
  C extends Context<RepositoryFlags>,
> implements IRepository<M, C>
{
  private readonly _class!: Constructor<M>;

  /**
   * @description Gets the model class constructor.
   * @summary Retrieves the constructor for the model class associated with this repository.
   * Throws an error if no class definition is found.
   * @return {Constructor<M>} The constructor for the model class
   */
  get class() {
    if (!this._class)
      throw new InternalError(`No class definition found for this repository`);
    return this._class;
  }

  /**
   * @description Gets the primary key property name of the model.
   * @summary Retrieves the name of the property that serves as the primary key for the model.
   * If not already determined, it finds the primary key using the model's decorators.
   * @return The name of the primary key property
   */
  protected get pk(): keyof M {
    return Model.pk(this.class);
  }

  /**
   * @description Gets the primary key properties.
   * @summary Retrieves the properties associated with the primary key of the model.
   * If not already determined, it triggers the pk getter to find the primary key properties.
   * @return {any} The properties of the primary key
   */
  protected get pkProps(): any {
    return Model.pkProps(this.class);
  }

  protected constructor(clazz?: Constructor<M>) {
    if (clazz) this._class = clazz;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    [this.create, this.read, this.delete].forEach((m) => {
      const name = m.name;
      wrapMethodWithContext(
        self,
        (self as any)[name + "Prefix"],
        m,
        (self as any)[name + "Suffix"]
      );
    });
    wrapMethodWithContextForUpdate(
      self,
      (self as any)[this.update.name + "Prefix"],
      this.update,
      (self as any)[this.update.name + "Suffix"]
    );
  }

  /**
   * @description Creates a new model instance in the repository.
   * @summary Persists a new model instance to the underlying data store.
   * This method must be implemented by concrete repository classes.
   * @param {M} model - The model instance to create
   * @param {any[]} args - Additional arguments for the create operation
   * @return {Promise<M>} A promise that resolves to the created model instance
   */
  abstract create(model: M, ...args: any[]): Promise<M>;

  /**
   * @description Creates multiple model instances in the repository.
   * @summary Persists multiple model instances to the underlying data store by calling
   * the create method for each model in the array.
   * @param {M[]} models - The array of model instances to create
   * @param {any[]} args - Additional arguments for the create operation
   * @return {Promise<M[]>} A promise that resolves to an array of created model instances
   */
  async createAll(models: M[], ...args: any[]): Promise<M[]> {
    return Promise.all(models.map((m) => this.create(m, ...args)));
  }

  /**
   * @description Prepares a model for creation and executes pre-creation operations.
   * @summary Processes a model before it is created in the data store. This includes
   * creating a context, instantiating a new model instance, and enforcing any decorators
   * that should be applied before creation.
   * @param {M} model - The model instance to prepare for creation
   * @param {any[]} args - Additional arguments for the create operation
   * @return A promise that resolves to an array containing the prepared model and context arguments
   */
  protected async createPrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...any[], C]> {
    const contextArgs: ContextArgs<C> = await Context.args<M, C>(
      OperationKeys.CREATE,
      this.class,
      args
    );
    model = new this.class(model);
    if (!contextArgs.context.get("ignoreHandlers"))
      await enforceDBDecorators<M, IRepository<M, C>, any>(
        this,
        contextArgs.context,
        model,
        OperationKeys.CREATE,
        OperationKeys.ON
      );

    if (!contextArgs.context.get("ignoreValidation")) {
      const errors = await Promise.resolve(model.hasErrors());
      if (errors) throw new ValidationError(errors.toString());
    }

    return [model, ...contextArgs.args];
  }

  /**
   * @description Processes a model after creation and executes post-creation operations.
   * @summary Finalizes a model after it has been created in the data store. This includes
   * enforcing any decorators that should be applied after creation.
   * @param {M} model - The model instance that was created
   * @param {C} context - The context for the operation
   * @return {Promise<M>} A promise that resolves to the processed model instance
   */
  protected async createSuffix(model: M, context: C): Promise<M> {
    if (!context.get("ignoreHandlers"))
      await enforceDBDecorators<M, IRepository<M, C>, any>(
        this,
        context,
        model,
        OperationKeys.CREATE,
        OperationKeys.AFTER
      );
    return model;
  }

  /**
   * @description Prepares multiple models for creation and executes pre-creation operations.
   * @summary Processes multiple models before they are created in the data store. This includes
   * creating a context, instantiating new model instances, and enforcing any decorators
   * that should be applied before creation for each model.
   * @param {M[]} models - The array of model instances to prepare for creation
   * @param {any[]} args - Additional arguments for the create operation
   * @return  A promise that resolves to an array containing the prepared models and context arguments
   */
  protected async createAllPrefix(
    models: M[],
    ...args: any[]
  ): Promise<[M[], ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.CREATE,
      this.class,
      args
    );
    const ignoreHandlers = contextArgs.context.get("ignoreHandlers");
    const ignoreValidate = contextArgs.context.get("ignoreValidation");

    models = await Promise.all(
      models.map(async (m) => {
        const model = new this.class(m);
        if (!ignoreHandlers)
          await enforceDBDecorators<M, IRepository<M, C>, any>(
            this,
            contextArgs.context,
            model,
            OperationKeys.CREATE,
            OperationKeys.ON
          );
        return model;
      })
    );

    if (!ignoreValidate) {
      const modelsValidation = await Promise.all(
        models.map((m) => Promise.resolve(m.hasErrors()))
      );

      const errors = reduceErrorsToPrint(modelsValidation);

      if (errors) throw new ValidationError(errors);
    }
    return [models, ...contextArgs.args];
  }

  /**
   * @description Processes multiple models after creation and executes post-creation operations.
   * @summary Finalizes multiple models after they have been created in the data store. This includes
   * enforcing any decorators that should be applied after creation for each model.
   * @param {M[]} models - The array of model instances that were created
   * @param {C} context - The context for the operation
   * @return {Promise<M[]>} A promise that resolves to the array of processed model instances
   */
  protected async createAllSuffix(models: M[], context: C): Promise<M[]> {
    if (!context.get("ignoreHandlers"))
      await Promise.all(
        models.map((m) =>
          enforceDBDecorators<M, IRepository<M, C>, any>(
            this,
            context,
            m,
            OperationKeys.CREATE,
            OperationKeys.AFTER
          )
        )
      );
    return models;
  }

  /**
   * @description Retrieves a model instance from the repository by its primary key.
   * @summary Fetches a model instance from the underlying data store using its primary key.
   * This method must be implemented by concrete repository classes.
   * @param {PrimaryKeyType} key - The primary key of the model to retrieve
   * @param {any[]} args - Additional arguments for the read operation
   * @return {Promise<M>} A promise that resolves to the retrieved model instance
   */
  abstract read(key: PrimaryKeyType, ...args: any[]): Promise<M>;

  /**
   * @description Retrieves multiple model instances from the repository by their primary keys.
   * @summary Fetches multiple model instances from the underlying data store using their primary keys
   * by calling the read method for each key in the array.
   * @param {string[] | number[]} keys - The array of primary keys of the models to retrieve
   * @param {any[]} args - Additional arguments for the read operation
   * @return {Promise<M[]>} A promise that resolves to an array of retrieved model instances
   */
  async readAll(keys: PrimaryKeyType[], ...args: any[]): Promise<M[]> {
    return await Promise.all(keys.map((id) => this.read(id, ...args)));
  }

  /**
   * @description Processes a model after retrieval and executes post-read operations.
   * @summary Finalizes a model after it has been retrieved from the data store. This includes
   * enforcing any decorators that should be applied after reading.
   * @param {M} model - The model instance that was retrieved
   * @param {C} context - The context for the operation
   * @return {Promise<M>} A promise that resolves to the processed model instance
   */
  protected async readSuffix(model: M, context: C): Promise<M> {
    if (!context.get("ignoreHandlers"))
      await enforceDBDecorators<M, IRepository<M, C>, any>(
        this,
        context,
        model,
        OperationKeys.READ,
        OperationKeys.AFTER
      );
    return model;
  }

  /**
   * @description Prepares for reading a model and executes pre-read operations.
   * @summary Processes a key before a model is read from the data store. This includes
   * creating a context, instantiating a new model instance with the key, and enforcing any decorators
   * that should be applied before reading.
   * @param {string} key - The primary key of the model to read
   * @param {any[]} args - Additional arguments for the read operation
   * @return A promise that resolves to an array containing the key and context arguments
   */
  protected async readPrefix(
    key: PrimaryKeyType,
    ...args: any[]
  ): Promise<[PrimaryKeyType, ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.READ,
      this.class,
      args
    );
    const model: M = new this.class();
    model[this.pk] = key as any;
    await enforceDBDecorators<M, IRepository<M, C>, any>(
      this,
      contextArgs.context,
      model,
      OperationKeys.READ,
      OperationKeys.ON
    );
    return [key, ...contextArgs.args];
  }

  /**
   * @description Prepares for reading multiple models and executes pre-read operations.
   * @summary Processes multiple keys before models are read from the data store. This includes
   * creating a context, instantiating new model instances with the keys, and enforcing any decorators
   * that should be applied before reading for each key.
   * @param {string[] | number[]} keys - The array of primary keys of the models to read
   * @param {any[]} args - Additional arguments for the read operation
   * @return A promise that resolves to an array containing the keys and context arguments
   */
  protected async readAllPrefix(
    keys: PrimaryKeyType[],
    ...args: any[]
  ): Promise<[PrimaryKeyType[], ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.READ,
      this.class,
      args
    );
    await Promise.all(
      keys.map(async (k) => {
        const m = new this.class();
        m[this.pk] = k as any;
        return enforceDBDecorators<M, IRepository<M, C>, any>(
          this,
          contextArgs.context,
          m,
          OperationKeys.READ,
          OperationKeys.ON
        );
      })
    );
    return [keys, ...contextArgs.args];
  }

  /**
   * @description Processes multiple models after retrieval and executes post-read operations.
   * @summary Finalizes multiple models after they have been retrieved from the data store. This includes
   * enforcing any decorators that should be applied after reading for each model.
   * @param {M[]} models - The array of model instances that were retrieved
   * @param {C} context - The context for the operation
   * @return {Promise<M[]>} A promise that resolves to the array of processed model instances
   */
  protected async readAllSuffix(models: M[], context: C): Promise<M[]> {
    if (!context.get("ignoreHandlers"))
      await Promise.all(
        models.map((m) =>
          enforceDBDecorators<M, typeof this, any>(
            this,
            context as any,
            m,
            OperationKeys.READ,
            OperationKeys.AFTER
          )
        )
      );
    return models;
  }

  /**
   * @description Updates an existing model instance in the repository.
   * @summary Updates an existing model instance in the underlying data store.
   * This method must be implemented by concrete repository classes.
   * @param {M} model - The model instance to update
   * @param {any[]} args - Additional arguments for the update operation
   * @return {Promise<M>} A promise that resolves to the updated model instance
   */
  abstract update(model: M, ...args: any[]): Promise<M>;

  /**
   * @description Updates multiple model instances in the repository.
   * @summary Updates multiple model instances in the underlying data store by calling
   * the update method for each model in the array.
   * @param {M[]} models - The array of model instances to update
   * @param {any[]} args - Additional arguments for the update operation
   * @return {Promise<M[]>} A promise that resolves to an array of updated model instances
   */
  async updateAll(models: M[], ...args: any): Promise<M[]> {
    return Promise.all(models.map((m) => this.update(m, ...args)));
  }

  /**
   * @description Processes a model after update and executes post-update operations.
   * @summary Finalizes a model after it has been updated in the data store. This includes
   * enforcing any decorators that should be applied after updating.
   * @param {M} model - The model instance that was updated
   * @param {C} context - The context for the operation
   * @return {Promise<M>} A promise that resolves to the processed model instance
   */
  protected async updateSuffix(model: M, oldModel: M, context: C): Promise<M> {
    if (!context.get("ignoreHandlers"))
      await enforceDBDecorators<M, IRepository<M, C>, any>(
        this,
        context,
        model,
        OperationKeys.UPDATE,
        OperationKeys.AFTER,
        oldModel
      );
    return model;
  }

  /**
   * @description Prepares a model for update and executes pre-update operations.
   * @summary Processes a model before it is updated in the data store. This includes
   * creating a context, validating the primary key, retrieving the existing model,
   * and enforcing any decorators that should be applied before updating.
   * @param {M} model - The model instance to prepare for update
   * @param {any[]} args - Additional arguments for the update operation
   * @return A promise that resolves to an array containing the prepared model and context arguments
   */
  protected async updatePrefix(
    model: M,
    ...args: any[]
  ): Promise<[M, ...args: any[], C, M | undefined]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.UPDATE,
      this.class,
      args
    );

    const context = contextArgs.context;
    const ignoreHandlers = contextArgs.context.get("ignoreHandlers");
    const ignoreValidate = contextArgs.context.get("ignoreValidation");
    const pk = (model as any)[this.pk];
    if (!pk)
      throw new InternalError(
        `No value for the Id is defined under the property ${this.pk as string}`
      );

    let oldModel: M | undefined;
    if (context.get("applyUpdateValidation")) {
      oldModel = await this.read(pk as string);
      if (context.get("mergeForUpdate"))
        model = Model.merge(oldModel, model, this.class);
    }

    if (!ignoreHandlers)
      await enforceDBDecorators<M, IRepository<M, C>, any>(
        this,
        contextArgs.context,
        model,
        OperationKeys.UPDATE,
        OperationKeys.ON,
        oldModel
      );

    if (!ignoreValidate) {
      const errors = await Promise.resolve(model.hasErrors(oldModel as any));
      if (errors) throw new ValidationError(errors.toString());
    }
    return [model, ...contextArgs.args, oldModel];
  }

  /**
   * @description Prepares multiple models for update and executes pre-update operations.
   * @summary Processes multiple models before they are updated in the data store. This includes
   * creating a context, instantiating new model instances, and enforcing any decorators
   * that should be applied before updating for each model.
   * @param {M[]} models - The array of model instances to prepare for update
   * @param {any[]} args - Additional arguments for the update operation
   * @return A promise that resolves to an array containing the prepared models and context arguments
   */
  protected async updateAllPrefix(
    models: M[],
    ...args: any[]
  ): Promise<[M[], ...any[], C, M[] | undefined]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.UPDATE,
      this.class,
      args
    );

    const context = contextArgs.context;

    const ignoreHandlers = context.get("ignoreHandlers");
    const ignoreValidate = context.get("ignoreValidation");
    const ids = models.map((m) => {
      const id = m[this.pk];
      if (typeof id === "undefined")
        throw new InternalError(
          `No value for the Id is defined under the property ${this.pk as string}`
        );
      return id as string;
    });

    let oldModels: M[] | undefined;
    if (context.get("applyUpdateValidation")) {
      oldModels = await this.readAll(ids as string[], context);
      if (context.get("mergeForUpdate"))
        models = models.map((m, i) =>
          Model.merge((oldModels as any)[i], m, this.class)
        );
    }

    if (!ignoreHandlers)
      await Promise.all(
        models.map((m, i) =>
          enforceDBDecorators<M, IRepository<M, C>, any>(
            this,
            contextArgs.context,
            m,
            OperationKeys.UPDATE,
            OperationKeys.ON,
            oldModels ? oldModels[i] : undefined
          )
        )
      );

    if (!ignoreValidate) {
      let modelsValidation: any;
      if (!context.get("applyUpdateValidation")) {
        modelsValidation = await Promise.resolve(
          models.map((m) => m.hasErrors())
        );
      } else {
        modelsValidation = await Promise.all(
          models.map((m, i) =>
            Promise.resolve(m.hasErrors((oldModels as any)[i] as any))
          )
        );
      }

      const errors = reduceErrorsToPrint(modelsValidation);

      if (errors) throw new ValidationError(errors);
    }
    return [models, ...contextArgs.args, oldModels];
  }

  /**
   * @description Processes multiple models after update and executes post-update operations.
   * @summary Finalizes multiple models after they have been updated in the data store. This includes
   * enforcing any decorators that should be applied after updating for each model.
   * @param {M[]} models - The array of model instances that were updated
   * @param {C} context - The context for the operation
   * @return {Promise<M[]>} A promise that resolves to the array of processed model instances
   */
  protected async updateAllSuffix(
    models: M[],
    oldModels: M[] | undefined,
    context: C
  ): Promise<M[]> {
    if (
      context.get("applyUpdateValidation") &&
      !context.get("ignoreDevSafeGuards")
    ) {
      if (!oldModels)
        throw new InternalError("No previous versions of models provided");
    }
    if (!context.get("ignoreHandlers"))
      await Promise.all(
        models.map((m, i) =>
          enforceDBDecorators<M, IRepository<M, C>, any>(
            this,
            context,
            m,
            OperationKeys.UPDATE,
            OperationKeys.AFTER,
            oldModels ? oldModels[i] : undefined
          )
        )
      );
    return models;
  }

  /**
   * @description Deletes a model instance from the repository by its primary key.
   * @summary Removes a model instance from the underlying data store using its primary key.
   * This method must be implemented by concrete repository classes.
   * @param {string | number} key - The primary key of the model to delete
   * @param {any[]} args - Additional arguments for the delete operation
   * @return {Promise<M>} A promise that resolves to the deleted model instance
   */
  abstract delete(key: PrimaryKeyType, ...args: any[]): Promise<M>;

  /**
   * @description Deletes multiple model instances from the repository by their primary keys.
   * @summary Removes multiple model instances from the underlying data store using their primary keys
   * by calling the delete method for each key in the array.
   * @param {string[] | number[]} keys - The array of primary keys of the models to delete
   * @param {any[]} args - Additional arguments for the delete operation
   * @return {Promise<M[]>} A promise that resolves to an array of deleted model instances
   */
  async deleteAll(keys: PrimaryKeyType[], ...args: any[]): Promise<M[]> {
    return Promise.all(keys.map((k) => this.delete(k, ...args)));
  }

  /**
   * @description Processes a model after deletion and executes post-delete operations.
   * @summary Finalizes a model after it has been deleted from the data store. This includes
   * enforcing any decorators that should be applied after deletion.
   * @param {M} model - The model instance that was deleted
   * @param {C} context - The context for the operation
   * @return {Promise<M>} A promise that resolves to the processed model instance
   */
  protected async deleteSuffix(model: M, context: C): Promise<M> {
    if (!context.get("ignoreHandlers"))
      await enforceDBDecorators<M, IRepository<M, C>, any>(
        this,
        context,
        model,
        OperationKeys.DELETE,
        OperationKeys.AFTER
      );
    return model;
  }

  /**
   * @description Prepares for deleting a model and executes pre-delete operations.
   * @summary Processes a key before a model is deleted from the data store. This includes
   * creating a context, retrieving the model to be deleted, and enforcing any decorators
   * that should be applied before deletion.
   * @param {any} key - The primary key of the model to delete
   * @param {any[]} args - Additional arguments for the delete operation
   * @return A promise that resolves to an array containing the key and context arguments
   */
  protected async deletePrefix(
    key: PrimaryKeyType,
    ...args: any[]
  ): Promise<[PrimaryKeyType, ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.DELETE,
      this.class,
      args
    );
    const model = await this.read(key, ...contextArgs.args);
    await enforceDBDecorators<M, IRepository<M, C>, any>(
      this,
      contextArgs.context,
      model,
      OperationKeys.DELETE,
      OperationKeys.ON
    );
    return [key, ...contextArgs.args];
  }

  /**
   * @description Prepares for deleting multiple models and executes pre-delete operations.
   * @summary Processes multiple keys before models are deleted from the data store. This includes
   * creating a context, retrieving the models to be deleted, and enforcing any decorators
   * that should be applied before deletion for each model.
   * @param {string[] | number[]} keys - The array of primary keys of the models to delete
   * @param {any[]} args - Additional arguments for the delete operation
   * @return A promise that resolves to an array containing the keys and context arguments
   */
  protected async deleteAllPrefix(
    keys: PrimaryKeyType[],
    ...args: any[]
  ): Promise<[PrimaryKeyType[], ...any[], C]> {
    const contextArgs = await Context.args<M, C>(
      OperationKeys.DELETE,
      this.class,
      args
    );
    const models = await this.readAll(keys, ...contextArgs.args);
    await Promise.all(
      models.map(async (m) => {
        return enforceDBDecorators<M, IRepository<M, C>, any>(
          this,
          contextArgs.context,
          m,
          OperationKeys.DELETE,
          OperationKeys.ON
        );
      })
    );
    return [keys, ...contextArgs.args];
  }

  /**
   * @description Processes multiple models after deletion and executes post-delete operations.
   * @summary Finalizes multiple models after they have been deleted from the data store. This includes
   * enforcing any decorators that should be applied after deletion for each model.
   * @param {M[]} models - The array of model instances that were deleted
   * @param {C} context - The context for the operation
   * @return {Promise<M[]>} A promise that resolves to the array of processed model instances
   */
  protected async deleteAllSuffix(models: M[], context: C): Promise<M[]> {
    if (!context.get("ignoreHandlers"))
      await Promise.all(
        models.map((m) =>
          enforceDBDecorators<M, IRepository<M, C>, any>(
            this,
            context,
            m,
            OperationKeys.DELETE,
            OperationKeys.AFTER
          )
        )
      );
    return models;
  }

  /**
   * @description Returns a string representation of the repository.
   * @summary Creates a string that identifies this repository by the name of its model class.
   * @return {string} A string representation of the repository
   */
  toString(): string {
    return `${this.class.name} Repository`;
  }
}
