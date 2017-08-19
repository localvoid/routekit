const routekit = require("routekit");
const routekitJS = require("routekit-js");

const routes = new routekit.Builder();

function r(name, path, data) {
  routes.add(name, path, routekit.HttpMethod.GET, JSON.stringify(data));
}

r("static1", "/static", { location: "static1" });
r("static2", "/static/", { location: "static2" });
r("static3", "/static/a", { location: "static3" });
r("static4", "/static/b", { location: "static4" });

r("param1", "/param/:a", { location: "param1" });
r("param2", "/param/:a/", { location: "param2" });
r("param3", "/param/:a/b", { location: "param3" });
r("param4", "/param/:a/c", { location: "param4" });

r("catchAll1", "/catchAll/*w", { location: "catchAll1" });

r("nested1", "/nested/:a/", { location: "nested1" });
r("nested2", "/nested/:a/:b", { location: "nested2" });
r("nested3", "/nested/:a/:b/:c", { location: "nested3" });

r("mix1", "/mix/:a", { location: "mix1" });
r("mix2", "/mix/:a/static", { location: "mix2" });
r("mix3", "/mix/static", { location: "mix3" });
r("mix4", "/mix/static/:b", { location: "mix4" });

r("home", "/", { location: "home" });

process.stdout.write(
  routekitJS.jsEmitter({
    target: "ts",
  })(routes),
);
