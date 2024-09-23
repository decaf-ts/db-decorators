import {
  DecoratorMetadata,
  Errors,
  getPropertyDecorators,
  Model,
  ModelArg,
  ModelErrorDefinition,
  ModelErrors,
  ModelKeys,
  ReservedModels,
  sf,
  Validation,
  ValidationKeys,
  ValidationPropertyDecoratorDefinition,
} from "@decaf-ts/decorator-validation";
import { UpdateValidationKeys } from "../validation/constants";
import { UpdateValidator } from "../validation/validators/UpdateValidator";
import { DEFAULT_ERROR_MESSAGES as DEM } from "@decaf-ts/decorator-validation";

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
export function validateCompare<T extends DBModel>(
  oldModel: T,
  newModel: T,
  ...exceptions: string[]
): ModelErrorDefinition | undefined {
  const decoratedProperties: ValidationPropertyDecoratorDefinition[] = [];
  for (const prop in newModel)
    if (newModel.hasOwnProperty(prop) && exceptions.indexOf(prop) === -1)
      decoratedProperties.push(
        getPropertyDecorators(
          UpdateValidationKeys.REFLECT,
          newModel,
          prop,
        ) as ValidationPropertyDecoratorDefinition,
      );

  const result = decoratedProperties.reduce(
    (
      accum: undefined | ModelErrors,
      decoratedProperty: ValidationPropertyDecoratorDefinition,
    ) => {
      const { prop, decorators } = decoratedProperty;

      if (!decorators || !decorators.length) return accum;

      decorators.shift(); // remove the design:type decorator, since the type will already be checked

      let errs: { [indexer: string]: Errors } | undefined = decorators.reduce(
        (
          acc: undefined | { [indexer: string]: Errors },
          decorator: { key: string; props: {} },
        ) => {
          const validator: UpdateValidator = Validation.get(
            decorator.key,
          ) as UpdateValidator;
          if (!validator) {
            console.error(
              `Could not find Matching validator for ${decorator.key} for property ${String(decoratedProperty.prop)}`,
            );
            return acc;
          }

          const err: Errors = validator.updateHasErrors(
            newModel[prop.toString()],
            oldModel[prop.toString()],
            ...Object.values(decorator.props),
          );
          if (err) {
            acc = acc || {};
            acc[decorator.key] = err;
          }

          return acc;
        },
        undefined,
      );

      errs =
        errs ||
        Object.keys(newModel)
          .filter((k) => !errs || !errs[k])
          .reduce((acc: Record<string, any> | undefined, prop) => {
            let err: Errors;
            // if a nested Model
            const allDecorators = getPropertyDecorators(
              ValidationKeys.REFLECT,
              newModel,
              prop,
            ).decorators;
            const decorators = getPropertyDecorators(
              ValidationKeys.REFLECT,
              newModel,
              prop,
            ).decorators.filter(
              (d) =>
                [ModelKeys.TYPE, ValidationKeys.TYPE].indexOf(d.key) !== -1,
            );
            if (!decorators || !decorators.length) return acc;
            const dec = decorators.pop() as DecoratorMetadata;
            const clazz = dec.props.name
              ? [dec.props.name]
              : Array.isArray(dec.props.customTypes)
                ? dec.props.customTypes
                : [dec.props.customTypes];
            const reserved = Object.values(ReservedModels).map((v) =>
              v.toLowerCase(),
            ) as string[];

            clazz.forEach((c: string) => {
              if (reserved.indexOf(c.toLowerCase()) === -1) {
                switch (c) {
                  case "Array":
                  case "Set":
                    if (allDecorators.length) {
                      const listDec = allDecorators.find(
                        (d) => d.key === ValidationKeys.LIST,
                      );
                      if (listDec) {
                        let currentList, oldList;

                        if (c === "Array") {
                          currentList = (newModel as Record<string, any>)[prop];
                          oldList = (oldModel as Record<string, any>)[prop];
                        } else if (c === "Set") {
                          currentList = (newModel as Record<string, any>)[
                            prop
                          ].values();
                          oldList = (oldModel as Record<string, any>)[
                            prop
                          ].values();
                        } else {
                          throw new Error(`Invalid attribute type ${c}`);
                        }

                        const e: string[] = [];

                        for (let i = 0; i < currentList.length; i++) {
                          if (i >= oldList.length) break;

                          const cur = currentList[i];
                          const old = oldList[i];

                          if (
                            typeof cur === "undefined" ||
                            typeof old === "undefined"
                          )
                            continue;

                          const err = cur.hasErrors(old);
                          if (err)
                            e.push(
                              sf(
                                DEM.LIST_INSIDE as string,
                                (i + 1).toString(),
                                err.toString(),
                              ),
                            );
                        }

                        if (e.length) err = e.join("\n");
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
                          (oldModel as Record<string, any>)[prop],
                        );
                    } catch (e: any) {
                      console.warn(
                        sf("Model should be validatable but its not"),
                      );
                    }
                }
              }
            });

            if (err) {
              acc = acc || {};
              acc[prop] = err;
            }
            return acc;
          }, undefined);

      if (errs) {
        accum = accum || {};
        accum[decoratedProperty.prop.toString()] = errs;
      }

      return accum;
    },
    undefined,
  );
  return result ? new ModelErrorDefinition(result) : undefined;
}

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
  [indexer: string]: any;

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
}
