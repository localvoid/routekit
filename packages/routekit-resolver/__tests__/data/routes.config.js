const routekit = require("routekit");
const routekitJS = require("routekit-js");

const routes = new routekit.Builder();

function r(name, path, data) {
  routes.add(name, path, routekit.HttpMethod.GET, JSON.stringify(data));
}

r("static1", "/static", "static1");
r("static2", "/static/", "static2");
r("static3", "/static/a", "static3");
r("static4", "/static/b", "static4");

r("param1", "/param/:a", "param1");
r("param2", "/param/:a/", "param2");
r("param3", "/param/:a/b", "param3");
r("param4", "/param/:a/c", "param4");

r("catchAll1", "/catchAll/*w", "catchAll1");

r("nested1", "/nested/:a/", "nested1");
r("nested2", "/nested/:a/:b", "nested2");
r("nested3", "/nested/:a/:b/:c", "nested3");

r("mix1", "/mix/:a", "mix1");
r("mix2", "/mix/:a/static", "mix2");
r("mix3", "/mix/static", "mix3");
r("mix4", "/mix/static/:b", "mix4");

r("home", "/", "home");

process.stdout.write(
  routekitJS.jsEmitter({
    target: "ts",
  })(routes),
);
