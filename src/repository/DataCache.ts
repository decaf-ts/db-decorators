import { ConflictError, NotFoundError } from "./errors";

export class DataCache {
  private cache: Record<string, any> = {};

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
