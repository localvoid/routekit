Basic [RouteKit](https://github.com/localvoid/routekit) resolver for browser environments.

## Installation

NPM package `routekit-resolver` provides es6 modules and TypeScript typings.

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
  return resolve(ROUTES, path, merge);
}

match("/user/123");
```

## API

```ts
export interface ResolveResult<T> {
  data?: T;
  params?: string[];
}

export function resolve<T>(
  routes: RouteNode<T>,
  path: string,
  merge: (a: T | undefined, b: T | undefined, node: RouteNode<T>) => T,
): ResolveResult<T> | null;
```

`resolve` function has 3 parameters:

- `routes` is a reference to a routes tree.
- `path` is a path that should be resolved.
- `merge` is a function that will be used to merge data.

When resolve function returns `null` value it means that no match was found.
