/** Node is a route endpoint (has an associated state). */
const FLAGS_ENDPOINT = 0b0001;
/** Node is a static path segment (not a variable). */
const FLAGS_STATIC = 0b0010;
/** Static path is not "/" — has a path entry in `p`. */
const FLAGS_NOT_SLASH = 0b0100;
/** Node is a catch-all segment that captures until end of path. */
const FLAGS_CATCH_ALL = 0b1000;

/**
 * Flat array representation of a route trie.
 *
 * Three parallel arrays encode the tree in pre-order:
 * - `f`: flags | (childrenCount << 5) per node
 * - `p`: static path segments (only for Static+NotSlash nodes)
 * - `s`: endpoint states (only for Endpoint nodes)
 */
export interface RouteMap<T> {
  readonly f: number[];
  readonly p: string[];
  readonly s: T[];
}

/** Result of a successful path resolution. */
export interface ResolveResult<T> {
  /** The state associated with the matched route. */
  readonly state: T;
  /** Captured variable segment values, in order of appearance. */
  readonly vars: string[];
}

/** Current read positions into the three parallel arrays (`f`, `p`, `s`). */
interface NodeCursor {
  f: number;
  p: number;
  s: number;
}

/**
 * Advance cursors past a node and all its children without matching.
 * Used to skip subtrees when a node doesn't match the input path.
 */
const skipNode = <T>(map: RouteMap<T>, cursor: NodeCursor): void => {
  const flags = map.f[cursor.f++];
  const childrenLength = flags >> 5;
  // Only increment p if this is a non-root static node (Static + NotSlash)
  if ((flags & (FLAGS_STATIC | FLAGS_NOT_SLASH)) === (FLAGS_STATIC | FLAGS_NOT_SLASH)) {
    cursor.p++;
  }
  if (flags & FLAGS_ENDPOINT) {
    cursor.s++;
  }
  for (let i = 0; i < childrenLength; i++) {
    skipNode(map, cursor);
  }
};

/**
 * Recursively resolve a path against the route trie.
 *
 * For each node, tries to match the remaining path:
 * - Static nodes: match via longest common prefix
 * - Variable nodes: capture characters until the next '/'
 * - Catch-all nodes: capture all remaining characters
 *
 * Returns the first matching endpoint, or null if no match.
 */
const visitNode = <T>(
  map: RouteMap<T>,
  cursor: NodeCursor,
  path: string,
  vars: string[],
): ResolveResult<T> | null => {
  const flags = map.f[cursor.f++];
  const childrenLength = flags >> 5;
  let match = false;

  let stateIndex: number | undefined;
  if (flags & FLAGS_ENDPOINT) {
    stateIndex = cursor.s++;
  }

  let i = 0;
  if (flags & FLAGS_STATIC) {
    // Root node "/" uses a fixed staticPart; other static nodes read from p[]
    const staticPart = flags & FLAGS_NOT_SLASH ? map.p[cursor.p++] : '/';
    const sl = staticPart.length;
    const pl = path.length;
    const max = Math.max(pl, sl);

    // Find longest common prefix between path and static segment
    while (i < max && path[i] === staticPart[i]) {
      i++;
    }

    // Static node matches only if the entire static segment was consumed
    if (i === sl) {
      match = true;
    }
  } else if (flags & FLAGS_CATCH_ALL) {
    // Catch-all node: capture everything until end of path (including empty string)
    match = true;
    vars = vars.concat(path);
    i = path.length;
  } else {
    // Variable node: capture until the next '/' or end of path
    while (i < path.length && path[i] !== '/') {
      i++;
    }

    // Empty variable values are not allowed
    if (i) {
      match = true;
      vars = vars.concat(path.slice(0, i));
    }
  }

  if (match) {
    path = path.slice(i);

    for (i = 0; i < childrenLength; i++) {
      const result = visitNode(map, cursor, path, vars);
      if (result) {
        return result;
      }
    }

    if (!path && stateIndex !== void 0) {
      return { state: map.s[stateIndex], vars };
    }

    return null;
  }

  // No match — skip all children to keep cursors consistent
  for (i = 0; i < childrenLength; i++) {
    skipNode(map, cursor);
  }

  return null;
};

/** Resolve a URL path against a serialized route map. Returns the first match or null. */
export const resolve = <T>(map: RouteMap<T>, path: string): ResolveResult<T> | null =>
  visitNode(map, { f: 0, p: 0, s: 0 }, path, []);
