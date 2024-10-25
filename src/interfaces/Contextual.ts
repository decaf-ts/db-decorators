import { Context } from "../repository/Context";

export interface Contextual {
  context(): Promise<Context>;
}
