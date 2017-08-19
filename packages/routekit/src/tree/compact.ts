import { Node, NodeData } from "./node";

export const enum CompactNodeFlags {
  Match = 1,
  Static = 1 << 1,
  Param = 1 << 2,
  HasStaticChild = 1 << 3,
  HasParamChild = 1 << 4,
  SingleChild = 1 << 5,
  CatchAll = 1 << 6,
}

export class CompactNode<T> {
  flags: CompactNodeFlags;
  path?: string;
  children?: CompactNode<T> | CompactNode<T>[];
  data?: T;

  constructor(
    flags: CompactNodeFlags,
    path: string,
    children: | CompactNode<T> | CompactNode<T>[] | undefined,
    data: T | undefined,
  ) {
    this.flags = flags;
    if (path) {
      this.path = path;
    }
    if (children) {
      this.children = children;
    }
    this.data = data;
  }
}

export function toCompact<T>(node: Node<T>, httpMethod: keyof NodeData<T> = "get"): CompactNode<T> {
  let flags = 0;
  if (node.type === "s") {
    flags |= CompactNodeFlags.Static;
  } else if (node.type === "?") {
    flags |= CompactNodeFlags.Param;
  } else {
    throw new Error(`Invalid node type "${node.type}".`);
  }

  if (node.match) {
    flags |= CompactNodeFlags.Match;
  }

  if (node.catchAll) {
    flags |= CompactNodeFlags.CatchAll;
  }

  const staticChildren = node.getStaticChildren();
  const paramChild = node.getParamChild();

  let children: CompactNode<T> | CompactNode<T>[] | undefined = [];
  if (paramChild) {
    children.push(toCompact(paramChild));
    flags |= CompactNodeFlags.HasParamChild;
  }
  if (staticChildren.length > 0) {
    flags |= CompactNodeFlags.HasStaticChild;
    children = children.concat(staticChildren.map((c) => toCompact(c)));
  }

  if (children.length > 0) {
    if (children.length === 1) {
      flags |= CompactNodeFlags.SingleChild;
      children = children[0];
    }
  } else {
    children = undefined;
  }

  return new CompactNode(flags, node.path, children, node.data[httpMethod]);
}
