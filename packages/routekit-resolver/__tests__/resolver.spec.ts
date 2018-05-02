import { resolve } from "../src/index";
import { ROUTES } from "./data/routes";

function noopMerge(a: any, b: any) {
  return b;
}

function mergeLocations(a: any, b: any) {
  return a.concat(b);
}

function notMatch(path: string) {
  expect(resolve(ROUTES, noopMerge, path, {})).toBeNull();
}

function match(path: string, location: string, params: string[] = []) {
  const m = resolve(ROUTES, noopMerge, path, {});
  expect(m).not.toBeNull();
  expect(m!.params!).toEqual(params);
  expect(m!.data).toBe(location);
  return m;
}

function matchAndMerge(path: string, location: string[]) {
  const m = resolve(ROUTES, mergeLocations, path, ["start"]);
  expect(m).not.toBeNull();
  expect(m!.data! as string[]).toEqual(location);
}

describe("static", function () {
  test("should not match 1", function () {
    notMatch("/stati");
  });

  test("should not match 2", function () {
    notMatch("/static/a/");
  });

  test("should not match 3", function () {
    notMatch("/static/b/");
  });

  test("should match 1", function () {
    match("/static", "static1");
  });

  test("should match 2", function () {
    match("/static/", "static2");
  });

  test("should match 3", function () {
    match("/static/a", "static3");
  });

  test("should match 4", function () {
    match("/static/b", "static4");
  });
});

describe("param", function () {
  test("should not match 1", function () {
    notMatch("/param/");
  });

  test("should not match 2", function () {
    notMatch("/param//");
  });

  test("should not match 3", function () {
    notMatch("/param/123/a");
  });

  test("should not match 4", function () {
    notMatch("/param/123/b/");
  });

  test("should not match 5", function () {
    notMatch("/param/123/c/");
  });

  test("should match 1", function () {
    match("/param/1", "param1", ["1"]);
  });

  test("should match 2", function () {
    match("/param/123", "param1", ["123"]);
  });

  test("should match 3", function () {
    match("/param/123/", "param2", ["123"]);
  });

  test("should match 4", function () {
    match("/param/123/b", "param3", ["123"]);
  });

  test("should match 5", function () {
    match("/param/123/c", "param4", ["123"]);
  });
});

describe("catchAll", function () {
  test("should not match 1", function () {
    notMatch("/catchAll");
  });

  test("should match 1", function () {
    match("/catchAll/", "catchAll1", []);
  });

  test("should match 2", function () {
    match("/catchAll/1", "catchAll1", ["1"]);
  });

  test("should match 3", function () {
    match("/catchAll/123", "catchAll1", ["123"]);
  });

  test("should match 4", function () {
    match("/catchAll/123/456", "catchAll1", ["123/456"]);
  });
});

describe("mix", function () {
  test("should not match 1", function () {
    notMatch("/mix");
  });

  test("should not match 2", function () {
    notMatch("/mix/1/");
  });

  test("should match 1", function () {
    match("/mix/1", "mix1", ["1"]);
  });

  test("should match 2", function () {
    match("/mix/1/static", "mix2", ["1"]);
  });

  test("should match 3", function () {
    match("/mix/static", "mix3");
  });

  test("should match 4", function () {
    match("/mix/static/1", "mix4", ["1"]);
  });
});

describe("merge data", function () {
  test("should merge static", function () {
    matchAndMerge("/static/b", ["start", "home", "static1", "static2", "static4"]);
  });

  test("should merge param", function () {
    matchAndMerge("/param/123/b", ["start", "home", "param1", "param2", "param3"]);
  });
});
