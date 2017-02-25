import { Node, NodeData } from "./node";

export const enum FastNodeType {
    Static = 0,
    Param = 1,
}

export class FastNode<T> {
    type: FastNodeType;
    match: boolean;
    catchAll: boolean;
    path: string;
    staticIndices: string[] | null;
    staticChildren: FastNode<T>[] | null;
    paramChild: FastNode<T> | null;
    data: NodeData<T> | null;

    constructor(
        type: FastNodeType,
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
    let type = 0;
    switch (node.type) {
        case "s":
            type = FastNodeType.Static;
            break;
        case "?":
            type = FastNodeType.Param;
            break;
        default:
            throw new Error(`Invalid node type "${node.type}".`);
    }

    const staticChildren = node.getStaticChildren();
    const paramChild = node.getParamChild();

    const newStaticChildren = staticChildren ? staticChildren.map((c) => toFast(c)) : null;
    const newStaticIndices = staticChildren ? staticChildren.map((c) => c.path[0]) : null;
    const newParamChild = paramChild ? toFast(paramChild) : null;

    return new FastNode<T>(
        type,
        node.match,
        node.catchAll,
        node.path,
        newStaticIndices,
        newStaticChildren,
        newParamChild,
        node.data ? node.data : null,
    );
}
