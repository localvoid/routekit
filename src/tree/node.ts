import { HttpMethod } from "../http";

/**
 * s - static node
 * ? - param node
 */
export type NodeType = "s" | "?";

export interface NodeData<T> {
    connect?: T;
    delete?: T;
    get?: T;
    head?: T;
    options?: T;
    patch?: T;
    post?: T;
    put?: T;
    trace?: T;
}

export class Node<T> {
    type: NodeType;
    path: string;
    match: boolean;
    catchAll: boolean;
    children: Node<T>[];
    data: NodeData<T>;
    meta: any;

    constructor(type: NodeType, path: string = "") {
        this.type = type;
        this.path = path;
        this.match = false;
        this.catchAll = false;
        this.children = [];
        this.data = {};
        this.meta = null;
    }

    pushStatic(path: string): Node<T> {
        let cn: Node<T> = this;
        if (this.type !== "s") {
            const c = this.findStaticChildByLabel(path[0]);
            if (c === undefined) {
                const n = new Node<T>("s", path);
                this.children.push(n);
                return n;
            }

            cn = c;
        }

        let s = path;

        while (true) {
            const nl = cn.path.length;
            const sl = s.length;
            const max = Math.max(nl, sl);
            let l = 0;

            while (l < max && cn.path.charCodeAt(l) === s.charCodeAt(l)) {
                l++;
            }

            if (l < nl) {
                // split
                const c = new Node<T>("s", cn.path.slice(l));
                c.match = cn.match;
                c.catchAll = cn.catchAll;
                c.children = cn.children;
                c.data = cn.data;
                c.meta = cn.meta;

                cn.path = cn.path.slice(0, l);
                cn.match = false;
                cn.catchAll = false;
                cn.children = [c];
                cn.data = {};
                cn.meta = null;

                if (sl === l) {
                    return cn;
                }

                const n = new Node<T>("s", s.slice(l));
                cn.children.push(n);
                return n;
            } else if (l < sl) {
                // next node
                s = s.slice(l);
                const c = this.findStaticChildByLabel(s[0]);
                if (c === undefined) {
                    const n = new Node<T>("s", s);
                    cn.children.push(n);
                    return n;
                }
                cn = c;
            } else {
                // finish
                return cn;
            }
        }
    }

    pushParam(): Node<T> {
        let n = this.findChildByType("?");
        if (n === undefined) {
            n = new Node<T>("?");
            this.children.push(n);
        }
        return n;
    }

    pushCatchAll(): Node<T> {
        if (this.catchAll) {
            throw new Error("Failed to add wildcard node, wildcard node is already assigned to this node.");
        }
        this.catchAll = true;
        return this;
    }

    findChildByType(type: NodeType): Node<T> | undefined {
        return this.children.find((n) => (n.type === type));
    }

    findStaticChildByLabel(label: string): Node<T> | undefined {
        return this.children.find((n) => (n.type === "s" && n.path[0] === label));
    }

    getParamChild(): Node<T> | undefined {
        return this.findChildByType("?");
    }

    getStaticChildren(): Node<T>[] {
        return this.children.filter((c) => c.type === "s");
    }

    setMeta(meta: any): void {
        this.meta = meta;
    }

    setData(method: HttpMethod, value: T): void {
        if (method & HttpMethod.CONNECT) {
            this.data.connect = value;
        }
        if (method & HttpMethod.DELETE) {
            this.data.delete = value;
        }
        if (method & HttpMethod.GET) {
            this.data.get = value;
        }
        if (method & HttpMethod.HEAD) {
            this.data.head = value;
        }
        if (method & HttpMethod.OPTIONS) {
            this.data.options = value;
        }
        if (method & HttpMethod.PATCH) {
            this.data.patch = value;
        }
        if (method & HttpMethod.POST) {
            this.data.post = value;
        }
        if (method & HttpMethod.PUT) {
            this.data.put = value;
        }
        if (method & HttpMethod.TRACE) {
            this.data.trace = value;
        }
    }

    setMatch(): void {
        this.match = true;
    }
}
