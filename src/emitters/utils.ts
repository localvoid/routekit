import { CompactNode } from "../tree/compact";
import { FastNode } from "../tree/fast";

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

function valueOrNull<T>(value: T | undefined): T | null {
    return value === undefined ? null : value;
}

export function jsEmitFastTree(n: FastNode<any>, depth = 0): string {
    const props = [];
    switch (n.type) {
        case "s":
            props.push(`${indent(depth + 1)}type: 0`);
            break;
        case "?":
            props.push(`${indent(depth + 1)}type: 1`);
            break;
    }
    props.push(`${indent(depth + 1)}match: ${n.match}`);
    props.push(`${indent(depth + 1)}catchAll: ${n.catchAll}`);
    props.push(`${indent(depth + 1)}path: "${n.path}"`);
    if (n.staticIndices) {
        props.push(`${indent(depth + 1)}staticIndices: ${JSON.stringify(n.staticIndices.map((i) => i.charCodeAt(0)))}`);
    } else {
        props.push(`${indent(depth + 1)}staticIndices: null`);
    }
    if (n.staticChildren) {
        props.push(`${indent(depth + 1)}staticChildren: [`
            + `${n.staticChildren.map((c) => jsEmitFastTree(c, depth + 1)).join(", ")}]`);
    } else {
        props.push(`${indent(depth + 1)}staticChildren: null`);
    }
    if (n.paramChild) {
        props.push(`${indent(depth + 1)}paramChild: ${jsEmitFastTree(n.paramChild, depth + 1)}`);
    } else {
        props.push(`${indent(depth + 1)}paramChild: null`);
    }
    if (n.data) {
        const data = [
            valueOrNull(n.data.connect),
            valueOrNull(n.data.delete),
            valueOrNull(n.data.get),
            valueOrNull(n.data.head),
            valueOrNull(n.data.options),
            valueOrNull(n.data.patch),
            valueOrNull(n.data.post),
            valueOrNull(n.data.put),
            valueOrNull(n.data.trace),
        ];
        while (data.length && data[data.length - 1] === null) {
            data.pop();
        }
        let dataOut = "[\n";
        for (let d of data) {
            dataOut += `${indent(depth + 2)}${d},\n`;
        }
        dataOut += `${indent(depth + 1)}]`;

        props.push(`${indent(depth + 1)}data: ${dataOut}`);
    } else {
        props.push(`${indent(depth + 1)}data: null`);
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
