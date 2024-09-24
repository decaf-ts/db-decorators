import { Constructor, required, sf } from "@decaf-ts/decorator-validation";
import { apply, metadata } from "@decaf-ts/reflection";
import { onCreate } from "../operations/decorators";
import { getDBKey, index } from "../model/decorators";
import { readonly, unique } from "../validation/decorators";
import { DBKeys } from "../model/constants";
import { Sequence } from "../interfaces/Sequence";
import { SequenceOptions } from "../interfaces/SequenceOptions";
import { IRepository } from "../interfaces/IRepository";
import { DBModel } from "../model/DBModel";
import { Sequence as Seq } from "../model/Sequence";
import { InternalError, NotFoundError } from "../repository/errors";
import { createOrUpdate } from "./utils";

export type IdOnCreateData = {
  sequence?: Constructor<Sequence>;
  options?: SequenceOptions;
};

/**
 * @summary Primary Key Decorator
 * @description Marks the property as the {@link DBModel}s primary key.
 *  Also marks the property as {@link unique} as {@required} and ensures the index is created properly according to the provided {@link Sequence}
 *
 *
 *
 * @function pk
 *
 * @memberOf module:wallet-db.Decorators
 *
 * @see unique
 * @see required
 * @see on
 * @param data
 * @param key
 * @param model
 */
export async function idOnCreate<
  T extends DBModel,
  V extends IRepository<T>,
  Y = IdOnCreateData,
>(this: V, data: Y, key: string, model: T): Promise<void> {
  const self = this;
  const args: IdOnCreateData = data || ({} as IdOnCreateData);
  if (!args.sequence) return;

  const setPrimaryKeyValue = function (
    target: T,
    propertyKey: string,
    value: string | number,
  ) {
    Object.defineProperty(target, propertyKey, {
      enumerable: true,
      writable: false,
      configurable: true,
      value: value,
    });
  };

  let sequencer: Sequence;
  try {
    sequencer = new args.sequence(
      this,
      Object.assign({}, args.options || {}) as SequenceOptions,
    );
  } catch (e: any) {
    throw new InternalError(
      `Failed to instantiate Sequence ${args.sequence.name}: ${e}`,
    );
  }

  // const hasPrimaryKey = model[key] !== undefined;
  const next = await sequencer.next();
  setPrimaryKeyValue(model, key, next);
  let repository: IRepository<Seq>;
  let dbSequence: Seq;
  try {
    repository = DBModel.findRepository(Seq);
    if (!repository) throw new InternalError(`No Sequence repository found`);
    dbSequence = await repository.read(self.class.name);
  } catch (e: any) {
    if (!(e instanceof NotFoundError)) throw e;
    dbSequence = new Seq({
      name: self.class.name,
    });
  }

  dbSequence.current = next;
  try {
    await createOrUpdate(dbSequence, repository!);
  } catch (e: any) {
    throw new InternalError(
      sf("Failed to update sequence for table {0}: {1}", self.class.name, e),
    );
  }
}

export function id(
  sequence?: Constructor<Sequence>,
  options?: SequenceOptions,
) {
  return apply(
    unique(),
    index(),
    required(),
    readonly(),
    onCreate(idOnCreate, {
      sequence: sequence,
      options: options,
    }),
    metadata(getDBKey(DBKeys.ID), {
      sequence: sequence ? sequence.name : undefined,
      options: options,
    }),
  );
}
