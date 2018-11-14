module.exports = {
  resetMocks: true,
  verbose: true,
  browser: false,
  globals: {
    "ts-jest": {
      "tsConfig": "tsconfig.json",
    },
  },
  moduleNameMapper: {
    "routekit": "<rootDir>/packages/routekit/src/",
    "routekit-resolver": "<rootDir>/packages/routekit-resolver/src/",
  },
  transform: {
    "\\.ts$": "ts-jest",
  },
  testRegex: "/__tests__/.*\\.spec\\.ts$",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.snap$",
    "/coverage/",
  ],
  moduleFileExtensions: ["ts", "js", "json"],
  coverageReporters: ["text", "json", "lcov", "html"],
  collectCoverageFrom: [
    "packages/**/src/**/*.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ],
  coveragePathIgnorePatterns: ["/__tests__/", "/node_modules/"],
  cacheDirectory: ".jest/cache",
};
