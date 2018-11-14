import { Route, build } from "./node";
import { FlatTree, toFlat } from "./flat";
import { createDirectiveMatcher, inject } from "incode";

export function emitter<T>(name = "ROUTES") {
  return (...routes: Route<T>[]) => `export const ${name} = ${emitFlatTree(toFlat(build(...routes)))};`;
}

export function injector<T>(src: string) {
  return (...routes: Route<T>[]) => (
    inject(src, createDirectiveMatcher("routekit"), ({ args }) => {
      const block: string = args.length === 0 || typeof args[0] !== "string" ? "routes" : args[0];

      switch (block) {
        case "routes": {
          return emitter(
            args.length < 1 || typeof args[1] !== "string" ? void 0 : args[1],
          )(...routes);
        }
        default:
          throw new Error(`Invalid block name: ${block}`);
      }
    })
  );
}

function emitFlatTree(tree: FlatTree<any>): string {
  let out = "{\n";
  out += "  f: [" + tree.flags.join(", ") + "],\n";
  out += "  p: [" + tree.paths.map((p) => JSON.stringify(p)).join(", ") + "],\n";
  out += "  s: [" + tree.state.join(", ") + "],\n";
  out += "}";

  return out;
}
