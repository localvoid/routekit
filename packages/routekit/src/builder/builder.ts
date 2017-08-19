import { Routes } from "../routes";
import { HttpMethod } from "../http";
import { Node } from "../tree/node";

export function noopTransformer(name: string): string {
  return name;
}

export class Builder<T> implements Routes {
  root: Node<T>;
  reverse: Map<string, string[]>;

  reverseNameTransformer: (name: string) => string;
  paramNameTransformer: (name: string) => string;

  constructor(
    reverseNameTransformer = noopTransformer,
    paramNameTransformer = noopTransformer,
  ) {
    this.root = new Node<T>("s", "/");
    this.reverse = new Map<string, string[]>();
    this.reverseNameTransformer = reverseNameTransformer;
    this.paramNameTransformer = paramNameTransformer;
  }

  add(name: string, path: string, method: HttpMethod, data?: T, meta?: any): void {
    if (!name) {
      throw new Error("Invalid name, name parameter cannot be an empty string.");
    }

    this._set(name, path, method, data, meta);
  }

  setData(path: string, method: HttpMethod, data?: T, meta?: any): void {
    this._set("", path, method, data, meta);
  }

  private _set(name: string, path: string, method: HttpMethod, data?: T, meta?: any): void {
    name = this.reverseNameTransformer(name);
    const reverse = [] as string[];

    if (this.reverse.has(name)) {
      throw new Error(`Route with name "${name}" is already registered.`);
    }

    if (path === "") {
      return;
    }

    if (path.charCodeAt(0) !== 47) {
      throw new Error("Invalid path, path should start with a '/' character.");
    }

    let n = this.root;

    if (path.length > 0) {
      let start = 0;
      let i = 0;

      while (i < path.length) {
        if (path.charCodeAt(i) === 58) { // ":" === 58
          const s = path.slice(start, i);
          n = n.pushStatic(s);
          reverse.push(s);

          start = i;
          while (i < path.length && path.charCodeAt(i) !== 47) {
            // skip until "/" character
            i++;
          }
          const pname = path.slice(start + 1, i);
          if (!pname) {
            throw new Error("Invalid parameter name, parameter name cannot be empty.");
          }
          n = n.pushParam();
          reverse.push(`?${this.paramNameTransformer(pname)}`);
          start = i;
        } else if (path.charCodeAt(i) === 42) { // "*" === 42
          const s = path.slice(start, i);
          n = n.pushStatic(s);
          reverse.push(s);

          let pname = path.slice(i + 1);
          if (!pname) {
            pname = "rest";
          }
          n = n.pushCatchAll();
          reverse.push(`*${this.paramNameTransformer(pname)}`);
          start = i;
          break;
        } else {
          i++;
        }
      }
      if (i > start) {
        const s = path.slice(start, i);
        n = n.pushStatic(s);
        reverse.push(s);
      }
    }

    if (data !== undefined) {
      n.setData(method, data);
    }
    if (meta !== undefined) {
      n.setMeta(meta);
    }
    if (name) {
      n.setMatch();
    }

    this.reverse.set(name, reverse);
  }
}
