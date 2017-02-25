import { Emitter } from "../emitter";
import { Routes } from "../routes";
import { toCompact } from "../tree/compact";
import { jsEmitCompactTree, jsEmitReverseMap } from "./utils";

export interface JSEmitterOptions {
    header?: string;
    footer?: string;
    routesName?: string;
    reverseFunctions?: boolean;
    reverseMap?: boolean;
    reverseMapName?: string;
    disableESLint?: boolean;
}

export class JSEmitter implements Emitter {
    options: JSEmitterOptions;

    constructor(options?: JSEmitterOptions) {
        this.options = {
            header: "",
            footer: "",
            routesName: "ROUTES",
            reverseFunctions: true,
            reverseMap: true,
            reverseMapName: "REVERSE",
            disableESLint: true,
            ...options,
        };
    }

    emit(routes: Routes): string {
        const compactTree = toCompact(routes.root);
        const routesOut = `export const ${this.options.routesName} = ${jsEmitCompactTree(compactTree)};`;

        let reverseFunctions: string[] = [];
        if (this.options.reverseFunctions) {
            routes.reverse.forEach((path, name) => {
                const params = [];
                const cpath = [];
                let currentStatic = "";
                let catchAllParam = "";

                for (let p of path) {
                    if (p[0] === "?") {
                        if (currentStatic) {
                            cpath.push(`"${currentStatic}"`);
                            currentStatic = "";
                        }
                        const s = p.slice(1);
                        cpath.push(s);
                        params.push(s);
                    } else if (p[0] === "*") {
                        if (currentStatic) {
                            cpath.push(`"${currentStatic}"`);
                            currentStatic = "";
                        }
                        const s = p.slice(1);
                        catchAllParam = s;
                        params.push(s);
                    } else {
                        currentStatic += p;
                    }
                }
                if (currentStatic) {
                    cpath.push(`"${currentStatic}"`);
                    currentStatic = "";
                }

                let fn = `export function ${name}(${params.join(", ")}) {\n`;
                if (catchAllParam) {
                    fn += `  if (${catchAllParam} === undefined) {\n`;
                    fn += `    return ${cpath.join(" + ")}\n`;
                    fn += `  }\n`;
                    fn += `  return ${cpath.join(" + ")} + ${catchAllParam};\n`;
                    fn += `}`;
                } else {
                    fn += `  return ${cpath.join(" + ")};\n`;
                    fn += "}";
                }
                reverseFunctions.push(fn);
            });
        }

        let output = "";
        if (this.options.disableESLint) {
            output += "/* eslint-disable */\n";
        }
        output += "/**\n";
        output += " * DO NOT MODIFY!\n";
        output += " *\n";
        output += " * This file is generated by routekit.\n";
        output += " */\n\n";
        if (this.options.header) {
            output += this.options.header + "\n\n";
        }
        output += routesOut;
        if (this.options.reverseFunctions) {
            output += "\n\n" + reverseFunctions.join("\n\n") + "\n";
            if (this.options.reverseMap) {
                output += `\nexport const ${this.options.reverseMapName} = ${jsEmitReverseMap(routes.reverse)};\n`;
            }
        }
        if (this.options.footer) {
            output += "\n" + this.options.footer;
        }

        return output;
    }
}
