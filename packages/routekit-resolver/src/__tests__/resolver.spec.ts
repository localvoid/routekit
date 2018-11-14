import { resolve } from "../index";
import { ROUTES } from "./data/routes";

function notMatch(path: string) {
  expect(resolve(ROUTES, path)).toBeNull();
}

function match(path: string, location: string, params: string[] = []) {
  const m = resolve(ROUTES, path);
  expect(m).not.toBeNull();
  expect(m!.vars!).toEqual(params);
  expect(m!.state).toBe(location);
  return m;
}

describe("static", () => {
  test("should not match 1", () => {
    notMatch("/stati");
  });

  test("should not match 2", () => {
    notMatch("/static/a/");
  });

  test("should not match 3", () => {
    notMatch("/static/b/");
  });

  test("should match 1", () => {
    match("/static", "static1");
  });

  test("should match 2", () => {
    match("/static/", "static2");
  });

  test("should match 3", () => {
    match("/static/a", "static3");
  });

  test("should match 4", () => {
    match("/static/b", "static4");
  });
});

describe("param", () => {
  test("should not match 1", () => {
    notMatch("/param/");
  });

  test("should not match 2", () => {
    notMatch("/param//");
  });

  test("should not match 3", () => {
    notMatch("/param/123/a");
  });

  test("should not match 4", () => {
    notMatch("/param/123/b/");
  });

  test("should not match 5", () => {
    notMatch("/param/123/c/");
  });

  test("should match 1", () => {
    match("/param/1", "param1", ["1"]);
  });

  test("should match 2", () => {
    match("/param/123", "param1", ["123"]);
  });

  test("should match 3", () => {
    match("/param/123/", "param2", ["123"]);
  });

  test("should match 4", () => {
    match("/param/123/b", "param3", ["123"]);
  });

  test("should match 5", () => {
    match("/param/123/c", "param4", ["123"]);
  });
});

describe("mix", () => {
  test("should not match 1", () => {
    notMatch("/mix");
  });

  test("should not match 2", () => {
    notMatch("/mix/1/");
  });

  test("should match 1", () => {
    match("/mix/1", "mix1", ["1"]);
  });

  test("should match 2", () => {
    match("/mix/1/static", "mix2", ["1"]);
  });

  test("should match 3", () => {
    match("/mix/static", "mix3");
  });

  test("should match 4", () => {
    match("/mix/static/1", "mix4", ["1"]);
  });
});
