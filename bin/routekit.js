#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const program = require("commander");
const resolve = require("resolve");

process.title = "routekit";

let routekit;
let routekitPath;
try {
    routekitPath = resolve.sync("routekit", { basedir: process.cwd() });
    routekit = require(routekitPath);
} catch (e) {
    try {
        routekit = require("routekit");
    } catch (e) {
        process.stderr.write(`Unable to find "routekit" module.\n`);
        process.exit(1);
    }
}

program
    .version("0.1.0")
    .usage("[options] <file>")
    .option("-o, --output <file>", "Output file")
    .parse(process.argv);

if (program.args.length === 0) {
    program.outputHelp();
    process.exit(1);
}

let configPath = program.args[0];
if (!path.isAbsolute(configPath)) {
    configPath = path.join(process.cwd(), configPath);
}

let outputPath = program.output;
if (outputPath !== undefined) {
    if (!path.isAbsolute(outputPath)) {
        outputPath = path.join(process.cwd(), outputPath);
    }
}

if (!fs.existsSync(configPath)) {
    process.stdout.write(`Cannot find config file: ${configPath}\n\n`);
    process.exit(1);
}

const config = require(configPath);
const routes = config.routes;
if (!routes) {
    process.stderr.write(`Config file should export routes structure.`);
    process.exit(1);
}
const emitter = config.emitter || new routekit.JSEmitter();
const result = emitter.emit(routes);

if (outputPath !== undefined) {
    mkdirp(path.dirname(outputPath), function (err) {
        if (err) {
            process.stderr.write(err);
            process.exit(1);
        } else {
            fs.writeFile(outputPath, result, function () {
                process.exit(0);
            });
        }
    });
} else {
    process.stdout.write(result);
    process.exit(0);
}
