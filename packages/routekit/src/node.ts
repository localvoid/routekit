export interface Node<T> {
  path: string;
  children: Node<T>[];
  state: T | null;
}

export interface Route<T> {
  readonly path: string;
  readonly state: T;
}

export function r<T>(path: string, state: T): Route<T> {
  return { path, state };
}

export function build<T>(...routes: Route<T>[]): Node<T> {
  const root = createNode<T>("/");

  for (const { path, state } of routes) {
    if (path === "") {
      throw new Error("Invalid path, path is empty");
    }

    if (path.charCodeAt(0) !== 47) {
      throw new Error("Invalid path, path should start with a '/' character");
    }

    let n = root;
    let start = 0;
    let i = 0;

    while (i < path.length) {
      if (path.charCodeAt(i) === 58) { // ":" === 58
        n = pushStatic(n, path.slice(start, i));

        start = i;
        while (i < path.length && path.charCodeAt(i) !== 47) {
          // skip until "/" character
          i++;
        }
        if ((i - start) <= 1) {
          throw new Error("Invalid variable, variable should have a name");
        }
        n = pushVariable(n);
        start = i;
      } else {
        i++;
      }
    }
    if (i > start) {
      n = pushStatic(n, path.slice(start, i));
    }

    n.state = state;
  }

  return root;
}

function createNode<T>(path = ""): Node<T> {
  return { path, children: [], state: null };
}

function pushStatic<T>(cn: Node<T>, path: string): Node<T> {
  if (cn.path === "") {
    const c = findStaticChildByLabel(cn, path[0]);
    if (c === void 0) {
      const n = createNode<T>(path);
      cn.children.push(n);
      return n;
    }

    cn = c;
  }

  let s = path;

  while (true) {
    const nl = cn.path.length;
    const sl = s.length;
    const max = Math.max(nl, sl);
    let i = 0;

    while (i < max && cn.path.charCodeAt(i) === s.charCodeAt(i)) {
      i++;
    }

    if (i < nl) {
      // split
      const c = createNode<T>(cn.path.slice(i));
      c.children = cn.children;
      c.state = cn.state;

      cn.path = cn.path.slice(0, i);
      cn.children = [c];
      cn.state = null;

      if (sl === i) {
        return cn;
      }

      const n = createNode<T>(s.slice(i));
      cn.children.push(n);
      return n;
    } else if (i < sl) {
      // next node
      s = s.slice(i);
      const c = findStaticChildByLabel(cn, s[0]);
      if (c === void 0) {
        const n = createNode<T>(s);
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

function pushVariable<T>(cn: Node<T>): Node<T> {
  let n = getVariableChild(cn);
  if (n === void 0) {
    n = createNode<T>();
    cn.children.push(n);
  }
  return n;
}

function findStaticChildByLabel<T>(cn: Node<T>, label: string): Node<T> | undefined {
  return cn.children.find((n) => (n.path.length > 0 && n.path[0] === label));
}

export function getVariableChild<T>(cn: Node<T>): Node<T> | undefined {
  return cn.children.find((n) => (n.path === ""));
}

export function getStaticChildren<T>(cn: Node<T>): Node<T>[] {
  return cn.children.filter((n) => (n.path !== ""));
}
