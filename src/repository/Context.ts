import { DataCache } from "./DataCache";
import { ContextArgs } from "./utils";
import { Contextual } from "../interfaces/Contextual";
import { NotFoundError } from "./errors";

export class Context extends DataCache {
  constructor(private parent?: Context) {
    super();
  }

  async get(key: string): Promise<any> {
    try {
      return super.get(key);
    } catch (e: any) {
      if (this.parent) return this.parent.get(key);
      throw e;
    }
  }

  async pop(key: string): Promise<any> {
    if (key in this.cache) return super.pop(key);
    if (!this.parent) throw new NotFoundError(`Key ${key} not in dataStore`);
    return this.parent.pop(key);
  }

  child(): Context {
    return this.constructor(this);
  }

  static async fromArgs(
    contextual: Contextual,
    args: any[]
  ): Promise<ContextArgs> {
    const last = args.pop();
    let c: Context;
    if (last) {
      if (last instanceof Context) {
        c = last;
        args.push(last);
      } else {
        c = await contextual.context();
        args.push(last, c);
      }
    } else {
      c = await contextual.context();
      args.push(c);
    }

    return { context: c, args: args };
  }
}
