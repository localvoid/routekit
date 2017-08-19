import { expect } from "iko";
import { resolve } from "../src/index";
import { ROUTES } from "./data/routes";

function noopMerge(a: any, b: any) {
  return b;
}

function mergeLocations(a: any, b: any) {
  if (a === undefined) {
    return ["start", b.location];
  } else if (b === undefined) {
    return a;
  }
  return a.concat(b.location);
}

function notMatch(path: string) {
  expect(resolve(ROUTES, path, noopMerge)).toBeNull();
}

function match(path: string, location: string, params: string[] = []) {
  const m = resolve(ROUTES, path, noopMerge);
  expect(m).notToBeNull();
  expect(m!.params!).toBeEqual(params);
  expect(m!.data.location).toBe(location);
  return m;
}

function matchAndMerge(path: string, location: string[]) {
  const m = resolve(ROUTES, path, mergeLocations);
  expect(m).notToBeNull();
  expect(m!.data! as string[]).toBeEqual(location);
}

describe("src/index.ts", function () {
  describe("static", function () {
    it("should not match 1", function () {
      notMatch("/stati");
    });

    it("should not match 2", function () {
      notMatch("/static/a/");
    });

    it("should not match 3", function () {
      notMatch("/static/b/");
    });

    it("should match 1", function () {
      match("/static", "static1");
    });

    it("should match 2", function () {
      match("/static/", "static2");
    });

    it("should match 3", function () {
      match("/static/a", "static3");
    });

    it("should match 4", function () {
      match("/static/b", "static4");
    });
  });

  describe("param", function () {
    it("should not match 1", function () {
      notMatch("/param/");
    });

    it("should not match 2", function () {
      notMatch("/param//");
    });

    it("should not match 3", function () {
      notMatch("/param/123/a");
    });

    it("should not match 4", function () {
      notMatch("/param/123/b/");
    });

    it("should not match 5", function () {
      notMatch("/param/123/c/");
    });

    it("should match 1", function () {
      match("/param/1", "param1", ["1"]);
    });

    it("should match 2", function () {
      match("/param/123", "param1", ["123"]);
    });

    it("should match 3", function () {
      match("/param/123/", "param2", ["123"]);
    });

    it("should match 4", function () {
      match("/param/123/b", "param3", ["123"]);
    });

    it("should match 5", function () {
      match("/param/123/c", "param4", ["123"]);
    });
  });

  describe("catchAll", function () {
    it("should not match 1", function () {
      notMatch("/catchAll");
    });

    it("should match 1", function () {
      match("/catchAll/", "catchAll1", []);
    });

    it("should match 2", function () {
      match("/catchAll/1", "catchAll1", ["1"]);
    });

    it("should match 3", function () {
      match("/catchAll/123", "catchAll1", ["123"]);
    });

    it("should match 4", function () {
      match("/catchAll/123/456", "catchAll1", ["123/456"]);
    });
  });

  describe("mix", function () {
    it("should not match 1", function () {
      notMatch("/mix");
    });

    it("should not match 2", function () {
      notMatch("/mix/1/");
    });

    it("should match 1", function () {
      match("/mix/1", "mix1", ["1"]);
    });

    it("should match 2", function () {
      match("/mix/1/static", "mix2", ["1"]);
    });

    it("should match 3", function () {
      match("/mix/static", "mix3");
    });

    it("should match 4", function () {
      match("/mix/static/1", "mix4", ["1"]);
    });
  });

  describe("merge data", function () {
    it("should merge static", function () {
      matchAndMerge("/static/b", ["start", "home", "static1", "static2", "static4"]);
    });

    it("should merge param", function () {
      matchAndMerge("/param/123/b", ["start", "home", "param1", "param2", "param3"]);
    });
  });
});
