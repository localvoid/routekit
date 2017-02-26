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
