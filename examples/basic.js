#!/usr/bin/env node

const routekit = require("routekit");

const routes = new routekit.Builder();

function r(name, path, data) {
    routes.add(name, path, routekit.HttpMethod.GET, JSON.stringify(data));
}

r("userView", "/user/:id", { location: "user/view" });
r("userEdit", "/user/:id/edit", { location: "user/edit" });
r("home", "/", { location: "home" });

console.log(routekit.jsEmitter()(routes));
