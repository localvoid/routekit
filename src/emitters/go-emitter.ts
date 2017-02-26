import { Emitter } from "../emitter";
import { Routes } from "../routes";
import { FastNode, toFast } from "../tree/fast";

export interface GOEmitterOptions {
    modulePath?: string;
    header?: string;
    footer?: string;
    routesName?: string;
    reverseFunctions?: boolean;
    reverseMap?: boolean;
    reverseMapName?: string;
}

export class GOEmitter implements Emitter {
    options: GOEmitterOptions;

    constructor(options?: GOEmitterOptions) {
        this.options = {
            modulePath: "github.com/localvoid/routekit-go/routekit",
            header: "",
            footer: "",
            routesName: "Routes",
            reverseFunctions: true,
            reverseMap: true,
            reverseMapName: "Reverse",
            ...options,
        };
    }

    emit(routes: Routes): string {
        let reverseFunctions: string[] = [];
        if (this.options.reverseFunctions) {
            routes.reverse.forEach((path, name) => {
                const params = [];
                const cpath = [];
                let currentStatic = "";

                for (let p of path) {
                    if (p[0] === "?" || p[0] === "*") {
                        if (currentStatic) {
                            cpath.push(`"${currentStatic}"`);
                            currentStatic = "";
                        }
                        const s = p.slice(1);
                        cpath.push(s);
                        params.push(`${s} Stringer`);
                    } else {
                        currentStatic += p;
                    }
                }
                if (currentStatic) {
                    cpath.push(`"${currentStatic}"`);
                }

                let fn = `func ${name}(${params.join(", ")}) string {\n`;
                fn += `\treturn ${cpath.join(" + ")}\n`;
                fn += "}";
                reverseFunctions.push(fn);
            });
        }

        let output = "";
        output += "// DO NOT MODIFY!\n";
        output += "//\n";
        output += "// This file is generated by routekit.\n\n";

        output += `import routekit "${this.options.modulePath}"\n\n`;

        if (this.options.header) {
            output += this.options.header + "\n\n";
        }
        output += `var ${this.options.routesName} *routekit.Node = ${emitRoutesTree(toFast(routes.root))}\n`;
        if (this.options.reverseFunctions) {
            output += "\n\n";
            output += reverseFunctions.join("\n\n") + "\n";
        }
        if (this.options.footer) {
            output += "\n" + this.options.footer;
        }

        return output;
    }
}

function emitRoutesTree(n: FastNode<any>, depth = 0): string {
    let out = "&routekit.Node{\n";
    switch (n.type) {
        case "s":
            out += `${indent(depth + 1)}type: 0,\n`;
            break;
        case "?":
            out += `${indent(depth + 1)}type: 1,\n`;
            break;
    }
    if (n.match) {
        out += `${indent(depth + 1)}match: true,\n`;
    }
    if (n.match) {
        out += `${indent(depth + 1)}catchAll: true,\n`;
    }
    if (n.path) {
        out += `${indent(depth + 1)}path: "${n.path}",\n`;
    }
    if (n.staticIndices) {
        out += indent(depth + 1);
        out += `staticIndices: []byte{${n.staticIndices.map((i) => i.charCodeAt(0)).join(", ")}},\n`;
    }
    if (n.staticChildren) {
        out += indent(depth + 1);
        out += "staticChildren: [\n";
        for (let c of n.staticChildren) {
            out += indent(depth + 2);
            out += emitRoutesTree(c, depth + 2);
            out += ",\n";
        }
        out += indent(depth + 1);
        out += "],\n";
    }
    if (n.paramChild) {
        out += indent(depth + 1);
        out += `paramChild: ${emitRoutesTree(n.paramChild, depth + 1)},\n`;
    }
    if (n.data) {
        out += indent(depth + 1);
        out += "data: &routekit.Handlers{\n";
        for (let k in n.data) {
            const v = (n.data as any)[k];
            out += indent(depth + 2);
            out += `${k}: ${v},\n`;
        }
        out += indent(depth + 1);
        out += "},\n";
    }
    out += indent(depth);
    out += "}";

    return out;
}

const _indentStrings: string[] = [];

function indent(n: number): string {
    if (n < _indentStrings.length) {
        return _indentStrings[n];
    }

    let s = "";
    while (n-- > 0) {
        s += "\t";
    }

    return _indentStrings[n] = s;
}