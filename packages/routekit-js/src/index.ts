import { Routes, FastNode, FlatTree, toFast, toFlat } from "routekit";
import { createDirectiveMatcher, inject as incodeInject } from "incode";

export interface JSEmitOptions {
  target?: "es2015" | "ts";
  mode?: "browser" | "server";
}

export function emitRoutes(routes: Routes, name: string = "ROUTES", options?: JSEmitOptions): string {
  options = { mode: "browser", ...options };

  switch (options.mode) {
    case "browser":
      return `export const ${name} = ${emitFlatTree(toFlat(routes.root))};`;
    case "server":
      return `export const ${name} = ${emitFastTree(toFast(routes.root))};`;
    default:
      throw new Error(`Invalid mode: ${options.mode}`);
  }
}

export function emitReverseFunctions(routes: Routes, options?: JSEmitOptions): string {
  const o: JSEmitOptions = { target: "es2015", mode: "browser", ...options };

  const reverseFunctions: string[] = [];
  routes.reverse.forEach((path, name) => {
    const params = [];
    const cpath = [];
    let currentStatic = "";
    let catchAllParam = "";

    for (const p of path) {
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
      fn += `  if (${catchAllParam} === void 0) {\n`;
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

  return reverseFunctions.join("\n\n");
}

export function emitReverseMap(routes: Routes, name: string = "REVERSE", options?: JSEmitOptions): string {
  return `export const ${name} = ${_emitReverseMap(routes.reverse)};\n`;
}

export function inject(routes: Routes, src: string, options?: JSEmitOptions): string {
  return incodeInject(
    src,
    createDirectiveMatcher("routekit"),
    (region) => {
      const args = region.args;
      const block: string = args.length === 0 || typeof args[0] !== "string" ? "routes" : args[0];

      switch (block) {
        case "routes": {
          const routesName = args.length < 1 || typeof args[1] !== "string" ? undefined : args[1];
          return emitRoutes(routes, routesName, options);
        }
        case "reverseFunctions": {
          return emitReverseFunctions(routes, options);
        }
        case "reverseMap": {
          const reverseMapName: string = args.length < 1 || typeof args[1] !== "string" ? undefined : args[1];
          return emitReverseMap(routes, reverseMapName, options);
        }
        default:
          throw new Error(`Invalid block name: ${block}`);
      }
    },
  );
}

function emitFlatTree(tree: FlatTree<any>): string {
  let out = "{\n";
  out += "  f: [" + tree.flags.join(", ") + "],\n";
  out += "  p: [" + tree.paths.map((p) => JSON.stringify(p)).join(", ") + "],\n";
  out += "  d: [" + tree.data.join(", ") + "],\n";
  out += "}";

  return out;
}

function emitFastTree(n: FastNode<any>, depth = 0): string {
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
      + `${n.staticChildren.map((c) => emitFastTree(c, depth + 1)).join(", ")}]`);
  } else {
    props.push(`${indent(depth + 1)}staticChildren: null`);
  }
  if (n.paramChild) {
    props.push(`${indent(depth + 1)}paramChild: ${emitFastTree(n.paramChild, depth + 1)}`);
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
    for (const d of data) {
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

function _emitReverseMap(reverse: Map<string, string[]>): string {
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

function emitParam(target: "es2015" | "ts", p: string): string {
  if (target === "es2015") {
    return p;
  }
  return `${p}: any`;
}
