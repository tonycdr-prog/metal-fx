# Testing Patterns

## 1) Test Stack and Commands

- Primary test framework: Vitest 2.1.9 with jsdom 25.0.1 for unit, component, and server-render tests.
- Browser test framework: Playwright 1.52.0 with Chromium, Firefox, and WebKit projects.
- Commands:

```bash
npm run test
npm run test:browser
npm run test:package
npm run check
npm run lint
npm run hygiene
npm run typecheck
npm run build
npm run build:demo
```

`npm run check` runs lint/hygiene, library/demo type checks, Vitest, builds, the package contents check, packed-artifact tests, and the production audit. The browser command remains separate locally because Playwright browser binaries must be installed first; CI installs them explicitly before running it.

## 2) Test Layout

- Pure unit tests are co-located under `src/`; React integration and SSR tests are co-located with `MetalFx`.
- Browser smoke tests live under `tests/e2e/`; packed-artifact fixtures live under `tests/package/`.
- Shared DOM test setup: `tests/setup.ts`.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | Yes | Color conversion, tweening, and glow geometry | Covers normalization, easing/clamping, and geometry branches |
| Integration | Yes | Basic child interaction, valid prop updates, final renderer cleanup | Engine, glow, and reflection boundaries are mocked deterministically |
| SSR/hydration | Partial | Server import/render; hydration infrastructure | Current `useLayoutEffect` warning is intentionally visible; warning-free hydration remains a TODO tied to REQ-004/REQ-005 |
| E2E/visual | Smoke | Built demo in Chromium, Firefox, and WebKit | Checks representative mounts, child interaction, and unexpected page/console errors; traces/screenshots are retained on failure |
| Packaging | Yes | ES/CJS exports, strict TypeScript, and tarball contents | `npm run test:package` installs only the packed artifact in isolated fixtures |

## 4) Mocking and Isolation Strategy

- React tests mock renderer, glow, and reflection boundaries so they can assert component lifecycle without emulating WebGL.
- jsdom setup supplies deterministic observer, RAF, and media-query primitives.
- Browser smoke tests use actual browser WebGL implementations; they avoid pixel-perfect output assertions in this foundation.

## 5) Coverage and Quality Signals

- Coverage tool + threshold: no threshold configured in this foundation.
- CI quality gates: `.github/workflows/quality.yml` runs `npm run check` on Node 22 and 24, plus a separate browser-smoke job that installs Chromium, Firefox, and WebKit and uploads failure artifacts.
- Known test gap: warning-free SSR/hydration is an explicit TODO until the dedicated production fix lands; the current server warning is not suppressed.
- Highest-value remaining gaps: concurrent different presets/themes, no-WebGL fallback, context loss/restore, StrictMode mount cycles, observer cleanup, pause/visibility, reflection target ownership, and visual regression baselines.

## 6) Evidence

- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/setup.ts`
- `tests/e2e/demo.spec.ts`
- `.github/workflows/pages.yml`
- `.github/workflows/publish.yml`
- `src/engine/renderer/core.ts`
- `src/engine/renderer/loop.ts`
- `docs/codebase/.codebase-scan.txt`
