[RouteKit](https://github.com/localvoid/routekit) is a set of tools for generating efficient routers.

## Installation

```sh
$ npm install -g routekit
```

## Usage Example

Create configuration file: `routes.config.js`

```js
const routekit = require("routekit");
const routes = new routekit.Builder();
function r(name, path, data) {
    routes.add(name, path, routekit.HttpMethod.GET, JSON.stringify(data));
}

r("userView", "/user/:id", { location: "user/view" });
r("userEdit", "/user/:id/edit", { location: "user/edit" });
r("home", "/", { location: "home" });

module.exports = {
    emitter: new routekit.JSEmitter(),
    routes: routes,
};
```

Run `routekit` CLI application

```sh
$ routekit -c routes.config.js -o routes.js
```

And it will generate `routes.js` file

```js
/* eslint-disable */
/**
 * DO NOT MODIFY!
 *
 * This file is generated by routekit.
 */

export const ROUTES = {
  f: 43,
  p: "/",
  c: {
    f: 50,
    p: "user/",
    c: {
      f: 45,
      c: {
        f: 3,
        p: "/edit",
        d: {"location":"user/edit"}
      },
      d: {"location":"user/view"}
    }
  },
  d: {"location":"home"}
};

export function userView(id) {
  return "/user/" + id;
}

export function userEdit(id) {
  return "/user/" + id + "/edit";
}

export function home() {
  return "/";
}

export const REVERSE = {
  "userView": userView,
  "userEdit": userEdit,
  "home": home
};
```

It contains compact radix tree and a set of functions that can be used to generate urls.

## Tools

### Builder

Builder provides an easy interface for building routes. It will perform all necessary transformations and generate a
radix tree.

```ts
export class RouteBuilder<T> implements Routes {
    add(name: string, path: string, method: HttpMethod, data?: T, meta?: any): void;
    setData(path: string, method: HttpMethod, data?: T, meta?: any): void;
}
```

It is possible that in the future there will be builders with different interfaces for building routes.

### Routes

Routes object contains details about registered routes as a radix tree and reverse mapping from route names to urls.

```ts
interface Routes {
    root: Node<any>;
    reverse: Map<string, string[]>;
}
```

### Emmiter

Emitter generates programming code from `Routes` object. Right now, there are two emitters available: `JSEmitter` and
`TSEmitter`.

#### JSEmitter

JSEmitter produces compact trees that can be used by resolvers that are working in browser environments.

```ts
interface JSEmitterOptions {
    header?: string;
    footer?: string;
    routesName?: string;
    reverseFunctions?: boolean;
    reverseMap?: boolean;
    reverseMapName?: string;
    disableESLint?: boolean;
}
```

#### TSEmitter

TSEmitter produces compact trees that can be used by resolvers that are working in browser environments.

```ts
interface TSEmitterOptions {
    header?: string;
    footer?: string;
    routesName?: string;
    reverseFunctions?: boolean;
    reverseMap?: boolean;
    reverseMapName?: string;
    disableTSLint?: boolean;
}
```

### Resolver

Resolver is a function that uses generated tree to find a match for an url.

Available resolvers:

- [routekit-resolver](https://github.com/localvoid/routekit-resolver) is a basic resolver for browser environments that
works with compact trees, generated by `JSEmitter` and `TSEmitter`.
