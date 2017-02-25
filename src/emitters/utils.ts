import { CompactNode } from "../tree/compact";

const _indentStrings: string[] = [];

function indent(n: number): string {
    if (n < _indentStrings.length) {
        return _indentStrings[n];
    }

    let s = "";
    while (n-- > 0) {
        s += "  ";
    }

    return _indentStrings[n] = s;
}

export function jsEmitCompactTree(n: CompactNode<any>, depth = 0): string {
    const props = [];
    props.push(`${indent(depth + 1)}f: ${n.flags}`);
    if (n.path) {
        props.push(`${indent(depth + 1)}p: "${n.path}"`);
    }
    if (n.children) {
        if (Array.isArray(n.children)) {
            props.push(`${indent(depth + 1)}c: [` +
                `${n.children.map((c) => jsEmitCompactTree(c, depth + 1)).join(", ")}]`);
        } else {
            props.push(`${indent(depth + 1)}c: ${jsEmitCompactTree(n.children, depth + 1)}`);
        }
    }
    if (n.data) {
        props.push(`${indent(depth + 1)}d: ${n.data}`);
    }

    let out = "";
    out += "{\n";
    out += props.join(",\n") + "\n";
    out += indent(depth) + "}";

    return out;
}

export function jsEmitReverseMap(reverse: Map<string, string[]>): string {
    return "{\n" + Array.from(reverse.keys()).map((n) => `  "${n}": ${n}`).join(",\n") + "\n}";
}
