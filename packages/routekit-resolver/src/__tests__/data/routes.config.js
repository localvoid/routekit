const { r, emitter } = require("routekit");

process.stdout.write("/* tslint:disable */\n");
process.stdout.write(emitter()(
  r("/", "home"),

  r("/static", "static1"),
  r("/static/", "static2"),
  r("/static/a", "static3"),
  r("/static/b", "static4"),

  r("/param/:a", "param1"),
  r("/param/:a/", "param2"),
  r("/param/:a/b", "param3"),
  r("/param/:a/c", "param4"),

  r("/nested/:a/", "nested1"),
  r("/nested/:a/:b", "nested2"),
  r("/nested/:a/:b/:c", "nested3"),

  r("/mix/:a", "mix1"),
  r("/mix/:a/static", "mix2"),
  r("/mix/static", "mix3"),
  r("/mix/static/:b", "mix4"),
));
