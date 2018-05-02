Basic [RouteKit](https://github.com/localvoid/routekit) resolver for browser environments.

## Installation

NPM package `routekit-resolver` provides a commonjs, es2015 modules and TypeScript typings.

```sh
npm install -D routekit-resolver
```

## Usage Example

```js
import { resolve } from "routekit-resolver";
import { ROUTES } from "./routes";

function merge(a, b) {
  return b;
}

function match(path) {
  return resolve(ROUTES, merge, path, "");
}

match("/user/123");
```

## API

```ts
export interface ResolveResult<T> {
  readonly data: T;
  readonly params: string[];
}

export function resolve<A, T>(
  map: RouteMap<T>,
  reducer: (a: A, b: T) => A,
  path: string,
  data: A,
): ResolveResult<A> | null;
```

`resolve` function has 4 parameters:

- `map` is a reference to a routes map.
- `reducer` is a function that takes the previous state and a data, and returns the next state.
- `path` is a path that should be resolved.
- `data` is a default state.

When resolve function returns `null` value it means that no match was found.
