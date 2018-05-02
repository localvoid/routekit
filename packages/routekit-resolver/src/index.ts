export const enum RouteNodeFlags {
  Match = 1,
  Static = 1 << 1,
  CatchAll = 1 << 2,
  HasValue = 1 << 3,
  NotSlash = 1 << 4,
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
   * Node data.
   */
  readonly d: T[];
}

interface NodeCursor {
  flagIndex: number;
  pathIndex: number;
  valueIndex: number;
}

function skipNode<T>(map: RouteMap<T>, cursor: NodeCursor): void {
  const flags = map.f[cursor.flagIndex++];
  const childrenLength = flags >> 5;
  if (
    (flags & (RouteNodeFlags.Static | RouteNodeFlags.NotSlash)) === (RouteNodeFlags.Static | RouteNodeFlags.NotSlash)
  ) {
    cursor.pathIndex++;
  }
  if (flags & RouteNodeFlags.HasValue) {
    cursor.valueIndex++;
  }
  for (let i = 0; i < childrenLength; i++) {
    skipNode(map, cursor);
  }
}

function visitNode<A, T>(
  map: RouteMap<T>,
  reducer: (a: A, b: T) => A,
  cursor: NodeCursor,
  path: string,
  data: A,
  params: string[],
): ResolveResult<A> | null {
  const flags = map.f[cursor.flagIndex++];
  const childrenLength = flags >> 5;
  let match = false;

  let nodeData: T | undefined;
  if (flags & RouteNodeFlags.HasValue) {
    nodeData = map.d[cursor.valueIndex++];
  }

  let i = 0;
  if (flags & RouteNodeFlags.Static) {
    const staticPart = (flags & RouteNodeFlags.NotSlash) ? map.p[cursor.pathIndex++] : "/";
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
  } else { // Param Node
    // capture param value
    while (i < path.length && path.charCodeAt(i) !== 47) { // 47 === "/"
      i++;
    }

    // param shouldn't be an empty string
    if (i) {
      match = true;
      params = [...params, path.slice(0, i)];
    }
  }

  if (match) {
    path = path.slice(i);
    if (nodeData !== void 0) {
      data = reducer(data, nodeData);
    }

    if (path) {
      for (i = 0; i < childrenLength; i++) {
        const result = visitNode(map, reducer, cursor, path, data, params);
        if (result) {
          return result;
        }
      }

      if (flags & RouteNodeFlags.CatchAll) {
        return { data, params: [...params, path] };
      }

      return null;
    } else if (flags & RouteNodeFlags.Match) {
      return { data, params };
    }
  }

  for (i = 0; i < childrenLength; i++) {
    skipNode(map, cursor);
  }

  return null;
}

export interface ResolveResult<T> {
  readonly data: T;
  readonly params: string[];
}

export function resolve<A, T>(
  map: RouteMap<T>,
  reducer: (a: A, b: T) => A,
  path: string,
  data: A,
): ResolveResult<A> | null {
  return visitNode(map, reducer, { flagIndex: 0, pathIndex: 0, valueIndex: 0 }, path, data, []);
}
