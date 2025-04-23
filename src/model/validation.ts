import {
  Model,
  ModelErrorDefinition,
  ModelErrors,
  ModelKeys,
  ReservedModels,
  sf,
  Validatable,
  Validation,
  ValidationKeys,
  ValidationPropertyDecoratorDefinition,
} from "@decaf-ts/decorator-validation";
import { DecoratorMetadata, Reflection } from "@decaf-ts/reflection";
import { UpdateValidationKeys, UpdateValidator } from "../validation";
import { findModelId } from "../identity";

/**
 * @summary Validates the update of a model
 *
 * @param {T} oldModel
 * @param {T} newModel
 * @param {string[]} [exceptions]
 *
 * @function validateCompare
 * @return {ModelErrorDefinition | undefined}
 *
 * @memberOf module:db-decorators.Model
 */
export function validateCompare<T extends Model>(
  oldModel: T,
  newModel: T,
  ...exceptions: string[]
): ModelErrorDefinition | undefined {
  const decoratedProperties: ValidationPropertyDecoratorDefinition[] = [];
  for (const prop in newModel)
    if (
      Object.prototype.hasOwnProperty.call(newModel, prop) &&
      exceptions.indexOf(prop) === -1
    )
      decoratedProperties.push(
        Reflection.getPropertyDecorators(
          UpdateValidationKeys.REFLECT,
          newModel,
          prop
        ) as ValidationPropertyDecoratorDefinition
      );

  let result: ModelErrors | undefined = undefined;

  for (const decoratedProperty of decoratedProperties) {
    const { prop, decorators } = decoratedProperty;

    decorators.shift(); // remove the design:type decorator, since the type will already be checked

    if (!decorators || !decorators.length) continue;
    let errs: Record<string, string | undefined> | undefined = undefined;

    for (const decorator of decorators) {
      const validator: UpdateValidator = Validation.get(
        decorator.key
      ) as UpdateValidator;
      if (!validator) {
        console.error(
          `Could not find Matching validator for ${decorator.key} for property ${String(decoratedProperty.prop)}`
        );
        continue;
      }

      const err: string | undefined = validator.updateHasErrors(
        (newModel as any)[prop.toString()],
        (oldModel as any)[prop.toString()],
        ...Object.values(decorator.props)
      );

      if (err) {
        errs = errs || {};
        errs[decorator.key] = err;
      }
    }

    if (errs) {
      result = result || {};
      result[decoratedProperty.prop.toString()] = errs;
    }
  }
  // tests nested classes
  for (const prop of Object.keys(newModel).filter((k) => {
    if (exceptions.includes(k)) return false;
    return !result || !result[k];
  })) {
    let err: string | undefined;
    // if a nested Model
    const allDecorators = Reflection.getPropertyDecorators(
      ValidationKeys.REFLECT,
      newModel,
      prop
    ).decorators;
    const decorators = Reflection.getPropertyDecorators(
      ValidationKeys.REFLECT,
      newModel,
      prop
    ).decorators.filter(
      (d) => [ModelKeys.TYPE, ValidationKeys.TYPE].indexOf(d.key as any) !== -1
    );
    if (!decorators || !decorators.length) continue;
    const dec = decorators.pop() as DecoratorMetadata;
    const clazz = dec.props.name
      ? [dec.props.name]
      : Array.isArray(dec.props.customTypes)
        ? dec.props.customTypes
        : [dec.props.customTypes];
    const reserved = Object.values(ReservedModels).map((v) =>
      v.toLowerCase()
    ) as string[];

    for (const c of clazz) {
      if (reserved.indexOf(c.toLowerCase()) === -1) {
        switch (c) {
          case Array.name:
          case Set.name:
            if (allDecorators.length) {
              const listDec = allDecorators.find(
                (d) => d.key === ValidationKeys.LIST
              );
              if (listDec) {
                let currentList, oldList;

                switch (c) {
                  case Array.name:
                    currentList = (newModel as Record<string, any>)[prop];
                    oldList = (oldModel as Record<string, any>)[prop];
                    break;
                  case Set.name:
                    currentList = (newModel as Record<string, any>)[
                      prop
                    ].values();
                    oldList = (oldModel as Record<string, any>)[prop].values();
                    break;
                  default:
                    throw new Error(`Invalid attribute type ${c}`);
                }

                err = currentList
                  .map((v: Validatable) => {
                    const id = findModelId(v as any, true);
                    if (!id) return "Failed to find model id";
                    const oldModel = oldList.find(
                      (el: any) => id === findModelId(el, true)
                    );

                    if (!oldModel) return; // nothing to compare with
                    return v.hasErrors(oldModel);
                  })
                  .filter((e: any) => !!e) as any;

                if (!err?.length) {
                  // if the result is an empty list...
                  err = undefined;
                }
              }
            }
            break;
          default:
            try {
              if (
                (newModel as Record<string, any>)[prop] &&
                (oldModel as Record<string, any>)[prop]
              )
                err = (newModel as Record<string, any>)[prop].hasErrors(
                  (oldModel as Record<string, any>)[prop]
                );
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e: any) {
              console.warn(sf("Model should be validatable but its not"));
            }
        }
      }
      if (err) {
        result = result || {};
        result[prop] = err as any;
      }
    }
  }
  return result ? new ModelErrorDefinition(result) : undefined;
}
