import { describe, expect, test } from 'bun:test';

import { emitRoutes, r } from '../src/emit.js';
import { resolve } from '../src/index.js';

describe('resolve', () => {
  test('resolves root path', async () => {
    const routes = await emitRoutes({ routes: [r('/', '"home"')] });
    expect(resolve(routes, '/')).toEqual({ state: '"home"', vars: [] });
  });

  test('resolves static routes', async () => {
    const routes = await emitRoutes({ routes: [r('/', '"home"'), r('/about', '"about"')] });
    expect(resolve(routes, '/')).toEqual({ state: '"home"', vars: [] });
    expect(resolve(routes, '/about')).toEqual({ state: '"about"', vars: [] });
  });

  test('resolves variable routes', async () => {
    const routes = await emitRoutes({ routes: [r('/users/:id', '"user"')] });
    expect(resolve(routes, '/users/42')).toEqual({ state: '"user"', vars: ['42'] });
  });

  test('does not capture empty variable', async () => {
    const routes = await emitRoutes({ routes: [r('/users/:id', '"user"')] });
    expect(resolve(routes, '/users/')).toBeNull();
  });

  test('resolves catch-all routes', async () => {
    const routes = await emitRoutes({ routes: [r('/files/*path', '"file"')] });
    expect(resolve(routes, '/files/docs/readme.md')).toEqual({
      state: '"file"',
      vars: ['docs/readme.md'],
    });
  });

  test('catch-all captures empty string at trailing slash', async () => {
    const routes = await emitRoutes({ routes: [r('/files/*path', '"file"')] });
    expect(resolve(routes, '/files/')).toEqual({ state: '"file"', vars: [''] });
  });

  test('resolves variable before catch-all', async () => {
    const routes = await emitRoutes({ routes: [r('/users/:id/*tab', '"user-tab"')] });
    expect(resolve(routes, '/users/42/settings')).toEqual({
      state: '"user-tab"',
      vars: ['42', 'settings'],
    });
  });

  test('resolves mixed routes', async () => {
    const routes = await emitRoutes({
      routes: [
        r('/', '"home"'),
        r('/about', '"about"'),
        r('/users/:id', '"user"'),
        r('/files/*path', '"file"'),
      ],
    });
    expect(resolve(routes, '/')).toEqual({ state: '"home"', vars: [] });
    expect(resolve(routes, '/about')).toEqual({ state: '"about"', vars: [] });
    expect(resolve(routes, '/users/42')).toEqual({ state: '"user"', vars: ['42'] });
    expect(resolve(routes, '/files/a/b/c')).toEqual({ state: '"file"', vars: ['a/b/c'] });
  });

  test('static route takes precedence over variable', async () => {
    const routes = await emitRoutes({
      routes: [r('/users/list', '"user-list"'), r('/users/:id', '"user"')],
    });
    expect(resolve(routes, '/users/list')).toEqual({ state: '"user-list"', vars: [] });
    expect(resolve(routes, '/users/42')).toEqual({ state: '"user"', vars: ['42'] });
  });
});
