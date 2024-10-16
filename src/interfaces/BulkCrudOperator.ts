import { CrudOperator } from "./CrudOperator";

export interface BulkCrudOperator<M> extends CrudOperator<M> {
  createAll(models: M[], ...args: any[]): Promise<M[]>;
  readAll(keys: string[] | number[], ...args: any[]): Promise<M[]>;
  updateAll(models: M[], ...args: any[]): Promise<M[]>;
  deleteAll(keys: string[] | number[], ...args: any[]): Promise<M[]>;
}
