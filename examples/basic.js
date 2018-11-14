#!/usr/bin/env node

const { r, emitter } = require("routekit");

console.log(emitter()(
  r("/", "home"),
  r("/user/:id", "user/view"),
  r("/user/:id/edit", "user/edit"),
));
