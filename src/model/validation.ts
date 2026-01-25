import {
  ConditionalAsync,
  Model,
  ModelConditionalAsync,
  ModelErrorDefinition,
  ModelErrors,
  ModelKeys,
  toConditionalPromise,
  Validation,
  ValidationKeys,
  getChildNestedPropsToIgnore,
} from "@decaf-ts/decorator-validation";
import { UpdateValidator } from "../validation/validators/UpdateValidator";
import { Constructor, Metadata } from "@decaf-ts/decoration";

/**
 * @description
 * Retrieves validation decorator definitions from a model for update operations, including
 * support for special handling of list decorators.
 *
 * @summary
 * Iterates over the model's own enumerable properties and filters out those specified in the
 * `propsToIgnore` array. For each remaining property, retrieves validation decorators specific
 * to update operations using the `UpdateValidationKeys.REFLECT` key. Additionally, it explicitly
 * checks for and appends any `LIST` type decorators to ensure proper validation of collection types.
 *
 * @template M - A generic parameter extending the `Model` class, representing the model type being inspected.
 *
 * @param {M} model - The model instance whose properties are being inspected for update-related validations.
 * @param {string[]} propsToIgnore - A list of property names to exclude from the validation decorator retrieval process.
 *
 * @return {ValidationPropertyDecoratorDefinition[]} An array of validation decorator definitions, including both
 * update-specific and list-type decorators, excluding those for ignored properties.
 *
 * @function getValidatableUpdateProps
 */
export function getValidatableUpdateProps<M extends Model>(
  model: M,
  propsToIgnore: string[]
): any[] {
  const decoratedProperties: any[] = [];
  for (const prop in model) {
    if (
      !Object.prototype.hasOwnProperty.call(model, prop) ||
      propsToIgnore.includes(prop)
    )
      continue;

    const decorators =
      Metadata.validationFor(model.constructor as Constructor, prop) || {};

    // Intentionally leaving this part commented out until all tests are complete
    // const listDecorator = getValidationDecorators(model, prop).decorators.find(
    //   ({ key }) => key === ValidationKeys.LIST
    // );

    // if (listDecorator)
    //   validationPropertyDefinition.decorators.push(listDecorator);

    decoratedProperties.push({ prop, decorators });
  }

  return decoratedProperties;
}

export function validateDecorator<
  M extends Model,
  Async extends boolean = false,
>(
  newModel: M,
  oldModel: M,
  prop: string,
  decorator: any,
  async?: Async
): ConditionalAsync<Async, string | undefined> {
  const validator: UpdateValidator = Validation.get(
    decorator.key
  ) as UpdateValidator;

  if (!validator) {
    throw new Error(`Missing validator for ${decorator.key}`);
  }

  // Skip validators that aren't UpdateValidators
  if (!validator.updateHasErrors) return toConditionalPromise(undefined, async);

  // skip async decorators if validateDecorators is called synchronously (async = false)
  if (!async && decorator.async) return toConditionalPromise(undefined, async);

  const decoratorProps = Object.values(decorator) || {};

  // const context = PathProxyEngine.create(obj, {
  //   ignoreUndefined: true,
  //   ignoreNull: true,
  // });

  const maybeError = validator.updateHasErrors(
    (newModel as any)[prop],
    (oldModel as any)[prop],
    ...decoratorProps
  );

  return toConditionalPromise(maybeError, async);
}

export function validateDecorators<
  M extends Model,
  Async extends boolean = false,
>(
  newModel: M,
  oldModel: M,
  prop: string,
  decorators: any,
  async?: Async
): ConditionalAsync<Async, Record<string, string>> | undefined {
  const result: Record<string, string | Promise<string>> = {};

  for (const decoratorKey in decorators) {
    const decorator = { ...decorators[decoratorKey], key: decoratorKey };
    // skip async decorators if validateDecorators is called synchronously (async = false)
    if (!async && decorator.async) continue;

    let validationErrors = validateDecorator(
      newModel,
      oldModel,
      prop,
      decorator,
      async
    );

    /*
    If the decorator is a list, each element must be checked.
    When 'async' is true, the 'err' will always be a pending promise initially,
    so the '!err' check will evaluate to false (even if the promise later resolves with no errors)
    */
    if (decorator.key === ValidationKeys.LIST && (!validationErrors || async)) {
      const newPropValue = (newModel as any)[prop];
      const oldPropValue = (oldModel as any)[prop];

      const newValues =
        newPropValue instanceof Set ? [...newPropValue] : newPropValue;
      const oldValues =
        oldPropValue instanceof Set ? [...oldPropValue] : oldPropValue;

      if (newValues?.length) {
        const types =
          decorator.class || decorator.clazz || decorator.customTypes;

        const allowedTypes = [types].flat().map((t) => {
          t = typeof t === "function" && !t.name ? t() : t;
          t = (t as any).name ? (t as any).name : t;
          return String(t).toLowerCase();
        });

        const errs = newValues.map((childValue: any) => {
          if (Model.isModel(childValue)) {
            // find by id so the list elements order doesn't matter
            const id = Model.pk(childValue as any, true);
            if (!id) return "Failed to find model id";
            const oldListModel = oldValues.find(
              (el: any) => id === Model.pk(el as any, true)
            );
            return childValue.hasErrors(oldListModel);
          }
          return allowedTypes.includes(typeof childValue)
            ? undefined
            : "Value has no validatable type";
        });

        if (async) {
          validationErrors = Promise.all(errs).then((result) => {
            const allEmpty = result.every((r) => !r);
            return allEmpty ? undefined : result;
          }) as any;
        } else {
          const allEmpty = errs.every((r: string | undefined) => !r);
          validationErrors = errs.length > 0 && !allEmpty ? errs : undefined;
        }
      }
    }

    if (validationErrors) (result as any)[decorator.key] = validationErrors;
  }

  if (!async)
    return Object.keys(result).length > 0 ? (result as any) : undefined;

  const keys = Object.keys(result);
  const promises = Object.values(result) as Promise<string | undefined>[];
  return Promise.all(promises).then((resolvedValues) => {
    const res: Record<string, string> = {};
    for (let i = 0; i < resolvedValues.length; i++) {
      const val = resolvedValues[i];
      if (val !== undefined) {
        res[keys[i]] = val;
      }
    }
    return Object.keys(res).length > 0 ? res : undefined;
  }) as any;
}

/**
 * @description Validates changes between two model versions
 * @summary Compares an old and new model version to validate update operations
 * @template M - Type extending Model
 * @param {M} oldModel - The original model version
 * @param {M} newModel - The updated model version
 * @param {boolean} async - A flag indicating whether validation should be asynchronous.
 * @param {...string[]} propsToIgnore - Properties to exclude from validation
 * @return {ModelErrorDefinition|undefined} Error definition if validation fails, undefined otherwise
 * @function validateCompare
 * @memberOf module:db-decorators
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant validateCompare
 *   participant Reflection
 *   participant Validation
 *
 *   Caller->>validateCompare: oldModel, newModel, propsToIgnore
 *   validateCompare->>Reflection: get decorated properties
 *   Reflection-->>validateCompare: property decorators
 *   loop For each decorated property
 *     validateCompare->>Validation: get validator
 *     Validation-->>validateCompare: validator
 *     validateCompare->>validateCompare: validate property update
 *   end
 *   loop For nested models
 *     validateCompare->>validateCompare: validate nested models
 *   end
 *   validateCompare-->>Caller: validation errors or undefined
 */
export function validateCompare<M extends Model<any>>(
  oldModel: M,
  newModel: M,
  async: boolean,
  ...propsToIgnore: string[]
): ModelConditionalAsync<M> {
  const ValidatableUpdateProps = getValidatableUpdateProps(
    newModel,
    propsToIgnore
  );

  const result: Record<string, any> = {};
  const nestedErrors: Record<string, any> = {};

  for (const { prop, decorators } of ValidatableUpdateProps) {
    const propKey = String(prop);
    const propValue = (newModel as any)[prop];

    const { designTypes } = Metadata.getPropDesignTypes(
      newModel.constructor as any,
      prop as keyof M
    );
    if (!designTypes) continue;

    // Handle array or Set types and enforce the presence of @list decorator
    if (designTypes.some((t) => [Array.name, Set.name].includes(t))) {
      if (
        !decorators ||
        !Object.keys(decorators).includes(ValidationKeys.LIST)
      ) {
        result[propKey] = {
          [ValidationKeys.TYPE]: `Array or Set property '${propKey}' requires a @list decorator`,
        };
        continue;
      }

      if (
        propValue &&
        !(Array.isArray(propValue) || propValue instanceof Set)
      ) {
        result[propKey] = {
          [ValidationKeys.TYPE]: `Property '${String(prop)}' must be either an Array or a Set`,
        };
        continue;
      }
    }

    // TODO: Check validateDecorators method partially working. Complete check pending.
    const propErrors: Record<string, any> =
      validateDecorators(newModel, oldModel, propKey, decorators, async) || {};

    // Check for nested model.
    // To prevent unnecessary processing, "propValue" must be defined
    const isConstr = Model.isPropertyModel(newModel, propKey);
    const hasPropValue = propValue !== null && propValue !== undefined;

    if (hasPropValue && isConstr) {
      const instance = propValue as Model;

      const Constr = designTypes
        .map((d: any) => Model.get(d.name || d))
        .find((d: any) => !!d) as any;

      const designTypeNames = designTypes.map((d: any) => {
        if (typeof d === "function")
          return d.name ? d.name.toLowerCase() : d()?.name.toLowerCase();
        return d.toLowerCase();
      });

      // Ensure instance is of the expected model class.
      if (!Constr || !(propValue instanceof Constr)) {
        if (designTypeNames.includes(typeof propValue)) {
          // do nothing
        } else {
          // If types don't match throw an error
          propErrors[ValidationKeys.TYPE] = !Constr
            ? `Unable to verify type consistency, missing model registry for ${designTypes.toString()} on prop ${propKey}`
            : `Value must be an instance of ${Constr.name}`;
          delete propErrors[ModelKeys.TYPE]; // remove duplicate type error
        }
      } else {
        const nestedPropsToIgnore = getChildNestedPropsToIgnore(
          propKey,
          ...propsToIgnore
        );
        nestedErrors[propKey] = instance.hasErrors(
          (oldModel as any)[prop],
          ...nestedPropsToIgnore
        );
      }
    }

    // Add to the result if we have any errors
    // Async mode returns a Promise that resolves to undefined when no errors exist
    if (Object.keys(propErrors).length > 0 || async)
      result[propKey] = propErrors;

    // Then merge any nested errors
    if (!async) {
      Object.entries(nestedErrors[propKey] || {}).forEach(([key, error]) => {
        if (error !== undefined) {
          result[`${propKey}.${key}`] = error;
        }
      });
    }
  }

  // Synchronous return
  if (!async) {
    return (
      Object.keys(result).length > 0
        ? new ModelErrorDefinition(result)
        : undefined
    ) as any;
  }

  const merged: any = result; // TODO: apply filtering

  const keys = Object.keys(merged);
  const promises = Object.values(merged);
  return Promise.allSettled(promises).then(async (results) => {
    const result: ModelErrors = {};

    for (const [parentProp, nestedErrPromise] of Object.entries(nestedErrors)) {
      const nestedPropDecErrors = (await nestedErrPromise) as Record<
        string,
        any
      >;

      if (nestedPropDecErrors)
        Object.entries(nestedPropDecErrors).forEach(
          ([nestedProp, nestedPropDecError]) => {
            if (nestedPropDecError !== undefined) {
              const nestedKey = [parentProp, nestedProp].join(".");
              result[nestedKey] = nestedPropDecError;
            }
          }
        );
    }

    for (let i = 0; i < results.length; i++) {
      const key = keys[i];
      const res = results[i];

      if (res.status === "fulfilled" && res.value !== undefined) {
        (result as any)[key] = res.value;
      } else if (res.status === "rejected") {
        (result as any)[key] =
          res.reason instanceof Error
            ? res.reason.message
            : String(res.reason || "Validation failed");
      }
    }

    return Object.keys(result).length > 0
      ? new ModelErrorDefinition(result)
      : undefined;
  }) as any;
}
