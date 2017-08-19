import { Node, NodeData, NodeType } from "./node";

export class FastNode<T> {
  type: NodeType;
  match: boolean;
  catchAll: boolean;
  path: string;
  staticIndices: string[] | null;
  staticChildren: FastNode<T>[] | null;
  paramChild: FastNode<T> | null;
  data: NodeData<T> | null;

  constructor(
    type: NodeType,
    match: boolean,
    catchAll: boolean,
    path: string,
    staticIndices: string[] | null,
    staticChildren: FastNode<T>[] | null,
    paramChild: FastNode<T> | null,
    data: NodeData<T> | null,
  ) {
    this.type = type;
    this.match = match;
    this.catchAll = catchAll;
    this.path = path;
    this.staticIndices = staticIndices;
    this.staticChildren = staticChildren;
    this.paramChild = paramChild;
    this.data = data;
  }
}

export function toFast<T>(node: Node<T>): FastNode<T> {
  const staticChildren = node.getStaticChildren();
  const paramChild = node.getParamChild();

  const newStaticChildren = staticChildren.map((c) => toFast(c));
  const newStaticIndices = staticChildren.map((c) => c.path[0]);
  const newParamChild = paramChild ? toFast(paramChild) : null;

  return new FastNode<T>(
    node.type,
    node.match,
    node.catchAll,
    node.path,
    newStaticIndices.length === 0 ? null : newStaticIndices,
    newStaticChildren.length === 0 ? null : newStaticChildren,
    newParamChild,
    node.data ? node.data : null,
  );
}
