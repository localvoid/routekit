import { Node, getStaticChildren, getVariableChild } from "./node";

export const enum FlatNodeFlags {
  Endpoint = 1,
  Static = 1 << 1,
  NotSlash = 1 << 2,
}

export interface FlatTree<T> {
  flags: number[];
  paths: string[];
  state: T[];
}

function _pushFlatNode<T>(tree: FlatTree<T>, node: Node<T>): void {
  let flags = 0;

  if (node.path !== "") {
    flags |= FlatNodeFlags.Static;
    if (node.path !== "/") {
      flags |= FlatNodeFlags.NotSlash;
      tree.paths.push(node.path);
    }
  }

  if (node.state !== null) {
    flags |= FlatNodeFlags.Endpoint;
    tree.state.push(node.state);
  }

  const staticChildren = getStaticChildren(node);
  const paramChild = getVariableChild(node);

  let childrenLength = staticChildren.length;
  if (paramChild) {
    childrenLength += 1;
  }

  tree.flags.push(flags | (childrenLength << 5));

  if (staticChildren.length > 0) {
    for (const c of staticChildren) {
      _pushFlatNode(tree, c);
    }
  }
  if (paramChild) {
    _pushFlatNode(tree, paramChild);
  }
}

export function toFlat<T>(node: Node<T>): FlatTree<T> {
  const tree = { flags: [], paths: [], state: [] };
  _pushFlatNode(tree, node);
  return tree;
}
