# Repository Guidance

## Project Overview

`metal-fx` is a React 18+ component library that renders an animated liquid-metal border with a shared WebGL renderer, per-instance 2D canvases, SVG glow, and optional proximity reflections. Published source lives in `src/`; the Vite/Tailwind showcase lives in `demo/`.

Preserve the capability boundaries:

- `src/MetalFx.tsx` adapts React and DOM lifecycle to engine APIs.
- `src/engine/renderer/` owns WebGL state, frame scheduling, compositing, and sampling.
- `src/engine/glow/` owns glow state and geometry.
- `src/engine/reflection/` owns reflection targets, geometry, observation, and painting.
- `src/index.ts` is the only public package entry point.

## Setup and Commands

```bash
npm ci
npm run dev
npm run check
```

Focused commands:

```bash
npm run format
npm run lint
npm run hygiene
npm run typecheck
npm run typecheck:demo
npm run test
npm run test:browser
npm run build
npm run build:demo
npm run package:check
```

`npm run check` is the required local and CI gate. Do not claim completion while it fails.

## Repository Hygiene

- Keep one clear responsibility per module. Do not split declarative shader, preset, markup, or CSS data merely to reduce line count.
- Files above 250 nonblank lines require a recorded review in `repo-hygiene.config.json`. Files above 350 lines must be decomposed or carry a documented exception with a reason and a concrete revisit trigger.
- React components must not own reusable shader math, geometry algorithms, or renderer scheduling.
- Engine modules must not import React or demo code. Renderer modules must not depend on glow or reflection implementations.
- Shared mutable state, DOM injection, observers, listeners, and RAF work require explicit lifecycle APIs and cleanup verification for behavioral changes.
- Keep public exports explicit in `src/index.ts`. Do not add package subpath exports or export-all statements without an approved API change.
- Do not retain dead scripts, unused dependencies, orphan assets, unexplained byte-identical assets, or hosting-only files in the npm tarball.
- Co-locate unit/component tests with the capability they verify. Put cross-browser/package scenarios under `tests/e2e/` or `tests/package/`.
- Keep behavioral fixes focused. Do not mix opportunistic refactors, dependency upgrades, formatting sweeps, and behavior changes in one review unit.
- Every hygiene exception must explain why the current structure is clearer and name the future change that should trigger reconsideration.

The executable policy is `scripts/check-hygiene.mjs`; do not weaken it solely to make a change pass.

## Code Style

- TypeScript is strict and uses ESM, type-only imports, and explicit named exports.
- Biome is the formatter and linter. Use two spaces, single quotes, a 120-column target, and no trailing commas.
- PascalCase names React components and public types. Engine files and functions use lower camelCase or simple lowercase names. Fixed tunings use uppercase snake case.
- Tool-consumed Vite, Vitest, and Playwright configuration files are the narrow exception to the named-export rule
  because those tools consume a default export.
- Prefer platform/browser primitives and installed dependencies before adding custom state or scheduling logic.

## Testing and Verification

- Add a focused runnable check for every non-trivial behavior change.
- Graphics behavior that depends on WebGL, layout, or browser rendering requires a real-browser check; DOM emulation alone is not sufficient final evidence.
- Lifecycle changes must cover mount, prop update, StrictMode cleanup/remount, and final unmount.
- Packaging changes must be verified against the packed tarball, not only workspace `dist/` files.
- Preserve the shared-work performance invariant: homogeneous instances share shader work; offscreen and fully paused instances idle.

## Build and Release

- `npm run build` creates the library in `dist/`.
- `npm run build:demo` creates the showcase in `dist-demo/`.
- The npm package may contain only the manifest, README, license, declarations, and runtime bundles approved by `package:check`.
- GitHub Actions publishes tags and deploys the demo. Never place credentials in the repository; npm publishing reads `NPM_TOKEN` from GitHub Actions secrets.

## Pull Requests

- Use one concern per PR or explicitly explain why concerns are inseparable.
- Complete `.github/pull_request_template.md` truthfully.
- Record every invoked verification command and its result.
- Changes to shared renderer architecture, SSR/hydration, fallback behavior, or lifecycle ownership require senior review even when automated checks pass.
