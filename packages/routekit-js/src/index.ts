import { Emitter, Routes, CompactNode, FastNode, toCompact, toFast } from "routekit";

export interface JSEmitterOptions {
  target?: "es6" | "ts";
  mode?: "browser" | "server";
  header?: string;
  footer?: string;
  routesName?: string;
  reverseFunctions?: boolean;
  reverseMap?: boolean;
  reverseMapName?: string;
  disableLint?: boolean;
}

export function jsEmitter(options?: JSEmitterOptions): Emitter {
  const o: JSEmitterOptions = {
    target: "es6",
    mode: "browser",
    header: "",
    footer: "",
    routesName: "ROUTES",
    reverseFunctions: true,
    reverseMap: true,
    reverseMapName: "REVERSE",
    disableLint: true,
    ...options,
  };

  return function (routes: Routes): string {
    let routesOut = "";

    switch (o.mode) {
      case "browser":
        routesOut = `export const ${o.routesName} = ${jsEmitCompactTree(toCompact(routes.root))};`;
        break;
      case "server":
        routesOut = `export const ${o.routesName} = ${jsEmitFastTree(toFast(routes.root))};`;
        break;
    }

    let reverseFunctions: string[] = [];
    if (o.reverseFunctions) {
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
            params.push(emitParam(o.target!, s));
          } else if (p[0] === "*") {
            if (currentStatic) {
              cpath.push(`"${currentStatic}"`);
              currentStatic = "";
            }
            const s = p.slice(1);
            catchAllParam = s;
            params.push(emitParam(o.target!, s));
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
    if (o.disableLint) {
      if (o.target === "es6") {
        output += "/* eslint-disable */\n";
      } else if (o.target === "ts") {
        output += "/* tslint:disable */\n";
      }
    }
    output += "/**\n";
    output += " * DO NOT MODIFY!\n";
    output += " *\n";
    output += " * This file is generated by routekit.\n";
    output += " */\n\n";
    if (o.header) {
      output += o.header + "\n\n";
    }
    output += routesOut;
    if (o.reverseFunctions) {
      if (o.target === "ts") {
        output += "\n\n";
        output += "export interface Stringifiable {\n";
        output += "  toString(): string;\n";
        output += "}";
      }
      output += "\n\n";
      output += reverseFunctions.join("\n\n") + "\n";
      if (o.reverseMap) {
        output += `\nexport const ${o.reverseMapName} = ${jsEmitReverseMap(routes.reverse)};\n`;
      }
    }
    if (o.footer) {
      output += "\n" + o.footer;
    }

    return output;
  };
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

function valueOrNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

function emitParam(target: "es6" | "ts", p: string): string {
  if (target === "es6") {
    return p;
  }
  return `${p}: Stringifiable`;
}
