export const enum RouteNodeFlags {
  Endpoint = 1,
  Static = 1 << 1,
  NotSlash = 1 << 2,
}

/**
 * RouteMap contains routing information.
 */
export interface RouteMap<T> {
  /**
   * Node flags | (children length << 7).
   *
   * [...flags: RouteNodeFlags]
   */
  readonly f: number[];
  /**
   * Node path.
   */
  readonly p: string[];
  /**
   * Node state.
   */
  readonly s: T[];
}

export interface ResolveResult<T> {
  readonly state: T;
  readonly vars: string[];
}

interface NodeCursor {
  f: number;
  p: number;
  s: number;
}

function skipNode<T>(map: RouteMap<T>, cursor: NodeCursor): void {
  const flags = map.f[cursor.f++];
  const childrenLength = flags >> 5;
  if (
    (flags & (RouteNodeFlags.Static | RouteNodeFlags.NotSlash)) === (RouteNodeFlags.Static | RouteNodeFlags.NotSlash)
  ) {
    cursor.p++;
  }
  if (flags & RouteNodeFlags.Endpoint) {
    cursor.s++;
  }
  for (let i = 0; i < childrenLength; i++) {
    skipNode(map, cursor);
  }
}

function visitNode<T>(
  map: RouteMap<T>,
  cursor: NodeCursor,
  path: string,
  vars: string[],
): ResolveResult<T> | null {
  const flags = map.f[cursor.f++];
  const childrenLength = flags >> 5;
  let match = false;

  let state!: T;
  if (flags & RouteNodeFlags.Endpoint) {
    state = map.s[cursor.s++];
  }

  let i = 0;
  if (flags & RouteNodeFlags.Static) {
    const staticPart = (flags & RouteNodeFlags.NotSlash) ? map.p[cursor.p++] : "/";
    const sl = staticPart.length;
    const pl = path.length;
    const max = Math.max(pl, sl);

    // longest common prefix
    while (i < max && path.charCodeAt(i) === staticPart.charCodeAt(i)) {
      i++;
    }

    // static part fully matched
    if (i === sl) {
      match = true;
    }
  } else { // Variable Node
    // capture variable value
    while (i < path.length && path.charCodeAt(i) !== 47) { // 47 === "/"
      i++;
    }

    // variable shouldn't be an empty string
    if (i) {
      match = true;
      vars = vars.concat(path.slice(0, i));
    }
  }

  if (match) {
    path = path.slice(i);

    if (path) {
      for (i = 0; i < childrenLength; i++) {
        const result = visitNode(map, cursor, path, vars);
        if (result) {
          return result;
        }
      }

      return null;
    } else if (flags & RouteNodeFlags.Endpoint) {
      return { state, vars };
    }
  }

  for (i = 0; i < childrenLength; i++) {
    skipNode(map, cursor);
  }

  return null;
}

export function resolve<T>(map: RouteMap<T>, path: string): ResolveResult<T> | null {
  return visitNode(map, { f: 0, p: 0, s: 0 }, path, []);
}
