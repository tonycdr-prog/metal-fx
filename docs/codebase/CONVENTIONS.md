# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | PascalCase for React components; lowercase/lower camelCase for engine utilities | `MetalFx.tsx`, `perfConfig.ts` | `src/`, `demo/components/` |
| Functions/methods | lower camelCase; imperative verbs for lifecycle operations | `createInstance`, `ensureSharedRenderer` | `src/engine/renderer/*.ts` |
| Types/interfaces | PascalCase; domain names rather than prefixes | `MetalFxProps`, `SharedRenderer` | `src/types.ts`, `src/engine/renderer/core.ts` |
| Constants | uppercase snake case for fixed tunings; PascalCase for preset objects | `FRAME_INTERVAL_MS`, `CHROMATIC` | `src/engine/perfConfig.ts`, `src/engine/presets.ts` |

## 2) Formatting and Linting

- Formatter/linter: Biome schema 2.4.9 in `biome.json`.
- Configured format: 2 spaces, 120-column width, no trailing commas.
- Notable configured rules: no unused imports/variables, no explicit `any`, type-only imports, no default exports, no namespace imports, and a 350-line hard ceiling.
- TypeScript uses `strict`, `isolatedModules`, `verbatimModuleSyntax`, and bundler module resolution.
- Biome 2.4.9 is pinned in the lockfile. `npm run lint` combines Biome with the custom hygiene gate, and `.github/workflows/quality.yml` runs the complete `npm run check` gate on pull requests and `main`.
- Files above 250 nonblank lines require a reason and revisit trigger in `repo-hygiene.config.json`; files above 350 must be decomposed or explicitly classified as declarative/excepted.
- Commands: `npm run format`, `npm run lint`, `npm run hygiene`, and `npm run check`.

## 3) Import and Module Conventions

- Source generally groups third-party imports before relative imports and uses `import type` for type-only symbols.
- Library code uses relative imports; the demo alone has an `@/*` alias.
- `src/index.ts` explicitly names public exports. `noBarrelFile` and `noReExportAll` are configured, though `src/index.ts` is intentionally the package entry surface.
- Vite config files have a narrow `noDefaultExport` override because Vite consumes default configuration exports.

The current enforceable repository policy is defined by `AGENTS.md`, `repo-hygiene.config.json`, and `npm run check`.

## 4) Error and Logging Conventions

- Low-level graphics initialization throws prefixed `Error` objects for missing WebGL/canvas resources and shader compile/link failures.
- Teardown catches and swallows cleanup failures to keep unmount idempotent.
- There is no fallback/error-boundary path in the component and no structured error type.
- No production logging library or `console` logging was found; logging/redaction conventions are [TODO].

## 5) Testing Conventions

- Test file naming/location: [TODO]; no test files or test configuration exist.
- Mocking strategy: [TODO].
- Coverage expectation: [TODO].

## 6) Evidence

- `biome.json`
- `tsconfig.json`
- `package.json`
- `src/MetalFx.tsx`
- `src/engine/renderer/core.ts`
- `src/index.ts`
- `demo/tsconfig.json`
