# Testing Patterns

## 1) Test Stack and Commands

- Primary test framework: none configured.
- Assertion/mocking tools: none configured.
- Commands:

```bash
# No automated test, integration, E2E, or coverage command exists.
npm run check
npm run lint
npm run hygiene
npm run typecheck
npm run build
npm run build:demo
```

On 2026-07-14, the library type check, library build, demo type check (`tsc -p demo/tsconfig.json --noEmit`), demo build, and npm dry-run pack succeeded. Declaration generation warned that API Extractor's bundled TypeScript 5.4.2 is older than the resolved TypeScript 5.9.3.

## 2) Test Layout

- Test file placement: none found in `src/` or `demo/`.
- Naming convention: [TODO].
- Setup files: none.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | No | Color conversion, geometry, tweening, sampling math | Deterministic modules are currently untested |
| Integration | No | React lifecycle + shared renderer + observers | Global registries and teardown are untested |
| E2E/visual | No | Browser rendering, themes, presets, pause, reflections | The demo is a manual showcase, not an automated oracle |
| Packaging | Partial/manual | ES/CJS exports and tarball contents | `npm pack --dry-run` is not in CI |

## 4) Mocking and Isolation Strategy

- Main mocking approach: [TODO].
- Needed isolation boundaries include DOM observers, RAF/time, WebGL/Canvas contexts, media queries, and module-level singleton reset.
- Likely failure mode: state leaking across tests through `SHARED`, glow registries, reflection targets, or module-level frame timestamps unless each test explicitly tears down/reset modules.

## 5) Coverage and Quality Signals

- Coverage tool + threshold: [TODO]; none configured.
- Current reported coverage: [TODO]; no report exists.
- CI quality gates: `.github/workflows/quality.yml` runs formatting/lint, hygiene, library/demo type checks, library/demo builds, and packed-file verification on pull requests and `main`.
- Remaining CI gap: there is still no unit, component, SSR/hydration, or browser test runner/coverage threshold.
- Highest-value gaps: concurrent different presets/themes, SSR/hydration, no-WebGL fallback, context loss/restore, StrictMode mount cycles, observer cleanup, pause/visibility, reflection target ownership, package exports on supported Node versions, and visual regression across Safari/Chromium/Firefox.

## 6) Evidence

- `package.json`
- `.github/workflows/pages.yml`
- `.github/workflows/publish.yml`
- `src/engine/renderer/core.ts`
- `src/engine/renderer/loop.ts`
- `docs/codebase/.codebase-scan.txt`
