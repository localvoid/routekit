# routekit

Client-side routing with code generation.

## Package Structure

```
src/
  index.ts   # Main routing logic (resolve function)
  emit.ts    # Route trie building and serialization
tests/       # Test suite
```

## Commands

- `bun run check` - Type-aware lint (oxlint + oxlint-tsgolint, typeCheck: true)
- `bun run format` - Format with oxfmt
- `bun run test` - Run tests
