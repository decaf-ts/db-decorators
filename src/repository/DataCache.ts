import { ConflictError, NotFoundError } from "./errors";
import { ObjectAccumulator } from "@decaf-ts/utils/lib/utils/accumulator";

export class DataCache2<C extends object> {
  protected cache: ObjectAccumulator<C> = new ObjectAccumulator();

  accumulate<V extends object>(value: V): DataCache2<C & V> {
    Object.defineProperty(this, "cache", {
      value: this.cache.accumulate(value) as C & V & ObjectAccumulator<C & V>,
    });
    return this as unknown as DataCache2<C & V>;
  }

  push(key: string, value: any) {
    if (key in this.cache)
      throw new ConflictError(`Key ${key} already in dataStore`);
    return this.put(key, value);
  }

  put(key: string, value: any) {
    return this.accumulate({ [key]: value });
  }

  pop(key: keyof ObjectAccumulator<C>) {
    const res = this.get(key);
    this.cache = this.cache.remove(key);
    return res;
  }
  //
  // filter(filter: string | RegExp) {
  //   if (typeof filter === "string") filter = new RegExp(filter);
  //   return Object.keys(this.cache)
  //     .filter((k) => !!filter.exec(k))
  //     .map((k) => this.cache[k as keyof ObjectAccumulator<C>]);
  // }

  get<K extends keyof ObjectAccumulator<C>>(key: K): ObjectAccumulator<C>[K] {
    const result = this.cache.get(key);
    if (!result)
      throw new Error(
        `${key} not found in accumulator. This should not happen`
      );
    return result;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  remove(
    key: keyof ObjectAccumulator<C> | string
  ):
    | (Omit<this, typeof key> & ObjectAccumulator<Omit<this, typeof key>>)
    | this {
    this.cache = this.cache.remove(key);
    return this;
  }

  keys(): string[] {
    return this.cache.keys();
  }

  values(): C[keyof C][] {
    return this.cache.values();
  }

  size(): number {
    return this.cache.size();
  }

  clear(): DataCache2<C> {
    this.cache = new ObjectAccumulator();
    return this;
  }

  forEach(
    callback: (
      value: ObjectAccumulator<C>[keyof ObjectAccumulator<C>],
      key: keyof ObjectAccumulator<C>,
      i: number
    ) => void
  ) {
    this.cache.forEach(callback);
  }

  map<R>(
    callback: (
      value: ObjectAccumulator<C>[keyof ObjectAccumulator<C>],
      key: keyof ObjectAccumulator<C>,
      i: number
    ) => R
  ): R[] {
    return this.cache.map(callback);
  }
}

export class DataCache {
  protected cache: Record<string, any> = {};

  async get(key: string) {
    if (!(key in this.cache))
      throw new NotFoundError(`Key ${key} not in dataStore`);
    return this.cache[key];
  }

  async push(key: string, value: any) {
    if (key in this.cache)
      throw new ConflictError(`Key ${key} already in dataStore`);
    this.cache[key] = value;
  }

  async put(key: string, value: any) {
    this.cache[key] = value;
  }

  async pop(key: string) {
    const res = this.get(key);
    delete this.cache[key];
    return res;
  }

  async filter(filter: string | RegExp) {
    if (typeof filter === "string") filter = new RegExp(filter);
    return Object.keys(this.cache)
      .filter((k) => !!filter.exec(k))
      .map((k) => this.cache[k]);
  }

  async purge(key?: string) {
    if (!key) this.cache = {};
    else await this.pop(key);
  }
}
