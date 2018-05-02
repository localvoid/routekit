import { Node, NodeData } from "./node";

export const enum FlatNodeFlags {
  Match = 1,
  Static = 1 << 1,
  CatchAll = 1 << 2,
  HasValue = 1 << 3,
  NotSlash = 1 << 4,
}

export interface FlatTree<T> {
  flags: number[];
  paths: string[];
  data: T[];
}

function _pushFlatNode<T>(tree: FlatTree<T>, node: Node<T>, httpMethod: keyof NodeData<T>): void {
  let flags = 0;

  if (node.type === "s") {
    flags |= FlatNodeFlags.Static;
    if (node.path !== "/") {
      flags |= FlatNodeFlags.NotSlash;
      tree.paths.push(node.path);
    }
  } else if (node.type !== "?") {
    throw new Error(`Invalid node type "${node.type}".`);
  }

  if (node.match) {
    flags |= FlatNodeFlags.Match;
  }

  if (node.catchAll) {
    flags |= FlatNodeFlags.CatchAll;
  }

  const data = node.data[httpMethod];
  if (data !== undefined) {
    flags |= FlatNodeFlags.HasValue;
    tree.data.push(data);
  }

  const staticChildren = node.getStaticChildren();
  const paramChild = node.getParamChild();

  let childrenLength = staticChildren.length;
  if (paramChild) {
    childrenLength += 1;
  }

  tree.flags.push(flags | (childrenLength << 5));

  if (staticChildren.length > 0) {
    for (const c of staticChildren) {
      _pushFlatNode(tree, c, httpMethod);
    }
  }
  if (paramChild) {
    _pushFlatNode(tree, paramChild, httpMethod);
  }
}

export function toFlat<T>(node: Node<T>, httpMethod: keyof NodeData<T> = "get"): FlatTree<T> {
  const tree = { flags: [], paths: [], data: [] };
  _pushFlatNode(tree, node, httpMethod);
  return tree;
}
