import { Cascade } from "./constants";
import { OrderDirection } from "../validation/constants";

/**
 * @summary defines the cascading behaviour
 */
export type CascadeMetadata = {
  update: Cascade;
  delete: Cascade;
};

export type IndexMetadata = {
  directions?: OrderDirection[2];
  compositions?: string[];
};
