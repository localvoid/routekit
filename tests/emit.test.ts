import { describe, expect, test } from 'bun:test';

import { emitRoutes, r } from '../src/emit.js';

describe('emitRoutes', () => {
  test('generates code for static routes', async () => {
    const routes = await emitRoutes({
      routes: [r('/', '"home"'), r('/about', '"about"')],
    });
    expect(routes).toEqual({
      f: [35, 7],
      p: ['about'],
      s: ['"home"', '"about"'],
    });
  });

  test('generates code for variable routes', async () => {
    const routes = await emitRoutes({ routes: [r('/users/:id', '"user"')] });
    expect(routes).toEqual({
      f: [34, 38, 1],
      p: ['users/'],
      s: ['"user"'],
    });
  });

  test('generates code for catch-all routes', async () => {
    const routes = await emitRoutes({ routes: [r('/files/*path', '"file"')] });
    expect(routes).toEqual({
      f: [34, 38, 9],
      p: ['files/'],
      s: ['"file"'],
    });
  });

  test('throws on empty path', async () => {
    expect(emitRoutes({ routes: [r('', 'invalid')] })).rejects.toThrow(
      'Invalid path, path is empty',
    );
  });

  test('throws on path not starting with /', async () => {
    expect(emitRoutes({ routes: [r('about', 'invalid')] })).rejects.toThrow(
      "Invalid path, path should start with a '/' character",
    );
  });

  test('throws on empty variable name', async () => {
    expect(emitRoutes({ routes: [r('/users/:', 'invalid')] })).rejects.toThrow(
      'Invalid variable, variable should have a name',
    );
  });

  test('throws on empty catch-all name', async () => {
    expect(emitRoutes({ routes: [r('/files/*', 'invalid')] })).rejects.toThrow(
      'Invalid catch-all, catch-all should have a name',
    );
  });

  test('throws on catch-all not at end', async () => {
    expect(emitRoutes({ routes: [r('/files/*path/extra', 'invalid')] })).rejects.toThrow(
      'Invalid catch-all, catch-all must be the last segment',
    );
  });

  test('throws on missing leading slash', async () => {
    expect(emitRoutes({ routes: [r('users', 'invalid')] })).rejects.toThrow(
      "Invalid path, path should start with a '/' character",
    );
  });
});
