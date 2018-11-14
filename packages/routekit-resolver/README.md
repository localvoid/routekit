# routekit-resolver

[RouteKit](https://github.com/localvoid/routekit) resolver for browser environments.

## Installation

NPM package `routekit-resolver` provides a commonjs, es2015 modules and TypeScript typings.

```sh
npm install -D routekit-resolver
```

## Usage Example

```js
import { resolve } from "routekit-resolver";
import { ROUTES } from "./routes";

const match = (path) => resolve(ROUTES, path);

match("/user/123");
```

## API

```ts
export interface ResolveResult<T> {
  readonly state: T;
  readonly vars: string[];
}

export function resolve<T>(map: RouteMap<T>, path: string): ResolveResult<T> | null;
```

`resolve()` function has 2 parameters:

- `map` is a reference to a routes map.
- `path` is a path that should be resolved.

When resolve function returns `null` value it means that no match was found.
