export const enum RouteNodeFlags {
  Match = 1,
  Static = 1 << 1,
  Param = 1 << 2,
  HasStaticChild = 1 << 3,
  HasParamChild = 1 << 4,
  SingleChild = 1 << 5,
  CatchAll = 1 << 6,
}

export interface RouteNode<T> {
  f: RouteNodeFlags;
  p?: string;
  c?: RouteNode<T>[] | RouteNode<T>;
  d?: T;
}

export interface ResolveResult<T> {
  data?: T;
  params?: string[];
}

function findChildByLabel<T>(node: RouteNode<T>, label: number): RouteNode<T> | null {
  const c = node.c;
  if (c) {
    if ((node.f & (RouteNodeFlags.SingleChild | RouteNodeFlags.HasStaticChild)) ===
      (RouteNodeFlags.SingleChild | RouteNodeFlags.HasStaticChild)) {
      return c as RouteNode<T>;
    } else {
      let i = (node.f & RouteNodeFlags.HasParamChild) ? 1 : 0;
      for (; i < (c as RouteNode<T>[]).length; i++) {
        const r = (c as RouteNode<T>[])[i];
        if (r.p!.charCodeAt(0) === label) {
          return r;
        }
      }
    }
  }
  return null;
}

function findParamChild<T>(node: RouteNode<T>): RouteNode<T> | null {
  if (node.f & RouteNodeFlags.HasParamChild) {
    if (node.f & RouteNodeFlags.SingleChild) {
      return node.c as RouteNode<T>;
    }
    return (node.c as RouteNode<T>[])[0];
  }

  return null;
}

export function resolve<T>(
  routes: RouteNode<T>,
  path: string,
  merge: (a: T | undefined, b: T | undefined, node: RouteNode<T>) => T,
): ResolveResult<T> | null {
  const params = [] as string[];
  let data: T | undefined;

  let cn = routes;
  let s = path;

  while (true) {
    // static node
    const nl = cn.p!.length;
    const sl = s.length;
    const max = Math.max(nl, sl);

    let i = 0;
    // longest common prefix
    while (i < max && cn.p!.charCodeAt(i) === s.charCodeAt(i)) {
      i++;
    }

    if (i === nl) {
      s = s.slice(i);
    } else {
      return null;
    }

    if (!s) {
      break;
    }

    let c = findChildByLabel(cn, s.charCodeAt(0));
    if (c) {
      data = merge(data, cn.d, cn);
      cn = c;
      continue;
    }

    c = findParamChild(cn);
    if (c) {
      data = merge(data, cn.d, cn);
      cn = c;

      i = 0;
      // capture param name
      while (i < s.length && s.charCodeAt(i) !== 47) {
        i++;
      }

      // param shouldn't be an empty string
      if (!i) {
        return null;
      }

      params.push(s.slice(0, i));
      s = s.slice(i);

      if (!s) {
        break;
      }

      // param nodes always have just one child
      if (cn.c) {
        data = merge(data, cn.d, cn);
        cn = cn.c as RouteNode<T>;
        continue;
      }

      return null;
    }

    if (cn.f & RouteNodeFlags.CatchAll) {
      params.push(s);
      break;
    }

    return null;
  }

  if (cn.f & RouteNodeFlags.Match) {
    return {
      params: params,
      data: merge(data, cn.d, cn),
    };
  }

  return null;
}
