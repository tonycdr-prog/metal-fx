# Testing Patterns

## 1) Test Stack and Commands

- Primary test framework: Vitest 4.1.10 with jsdom 25.0.1 for unit, component, and server-render tests.
- Browser test framework: Playwright 1.61.1 with Chromium, Firefox, and WebKit projects.
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
| SSR/hydration | Yes | Server import/render and client hydration | Covers auto/dark/light themes, StrictMode cleanup/remount, prop updates, media-query changes, and warning-free hydration |
| E2E/visual | Smoke | Built demo and forced no-WebGL fallback in Chromium, Firefox, and WebKit | Serves the build under the `/metal-fx/` Pages subpath and checks static assets, representative mounts, normal and fallback child interaction, and unexpected page/console errors. Traces/screenshots are retained on failure. Firefox CI explicitly permits its software WebGL renderer and forces EGL because hosted runners do not expose a supported hardware driver. |
| Packaging | Yes | ES/CJS exports, strict TypeScript, and tarball contents | `npm run test:package` installs only the packed artifact in isolated fixtures |

## 4) Mocking and Isolation Strategy

- React tests mock renderer, glow, and reflection boundaries so they can assert component lifecycle without emulating WebGL.
- jsdom setup supplies deterministic observer, RAF, and media-query primitives.
- Browser smoke tests use actual browser WebGL implementations; they avoid pixel-perfect output assertions in this foundation.

## 5) Coverage and Quality Signals

- Coverage tool + threshold: no threshold configured in this foundation.
- CI quality gates: `.github/workflows/quality.yml` runs `npm run check` on Node 22 and 24, plus a separate browser-smoke job that installs Chromium, Firefox, and WebKit and uploads failure artifacts.
- Pages deployment runs only after the complete Quality workflow succeeds on `main` and checks out that exact tested commit.
- Highest-value remaining gaps: context loss/restore, pause/visibility, reflection target ownership, and visual regression baselines.

## 6) Dependency Maintenance

Dependabot checks npm and GitHub Actions updates monthly against `main`. Compatible npm development minor/patch updates are grouped, while major updates stay isolated; Actions updates are grouped separately. Each ecosystem has an open-PR limit of one, there is no automatic merge, and every update must pass the Quality workflow before merge.

## 7) Evidence

- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/setup.ts`
- `tests/e2e/demo.spec.ts`
- `.github/workflows/pages.yml`
- `.github/workflows/publish.yml`
- `.github/dependabot.yml`
- `src/engine/renderer/core.ts`
- `src/engine/renderer/loop.ts`
- `docs/codebase/.codebase-scan.txt`
