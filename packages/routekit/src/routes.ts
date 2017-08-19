import { Node } from "./tree/node";

export interface Routes {
  root: Node<any>;
  reverse: Map<string, string[]>;
}
