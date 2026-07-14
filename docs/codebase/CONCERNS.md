# Codebase Concerns

Remediation acceptance contract: `spec/spec-process-stabilization-acceptance.md`.

## 1) Top Risks (Prioritized)

No unresolved high- or medium-severity repository risks are currently recorded.

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Runtime `scale` updates do not rebuild glow or recompute default ring/shader scale | Creation and resize bake derived values; update patch sets only `scale` | `MetalFx.tsx`, `renderer/loop.ts:updateInstance` | Dynamic scale changes only partially apply | Treat scale as an initialization-only prop or recompute every derived value |
| Reviewed large modules remain concentrated | Graphics state machines are inherently detailed | `repo-hygiene.config.json`, `MetalFx.tsx`, engine loop/glow/reflection modules | Future behavior can accumulate inside already dense modules | Honor recorded revisit triggers and require new review entries above 250 nonblank lines |

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Injected stylesheet and inline styles conflict with strict CSP | N/A | `styles.ts`, `glow/glow.ts`, `README.md` | Consumer documentation explicitly describes the limitation | No nonce/external stylesheet option is exposed; CSP-compatible rendering needs a future API/design project |

No auth, tenant data, server input, or network trust boundary exists in this client-only library.

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Glow queue updates one instance per rendered frame | `renderer/loop.ts`, `perfConfig.ts` | At ~15 fps, N instances each update at roughly 15/N fps | Many instances produce visibly stale halo movement | Measure and set a documented instance budget or adapt work to elapsed time |
| Full-resolution instance canvases do not cap DPR | `renderer/loop.ts:resizeInstanceCanvas` | GL is capped at DPR 2, destination/reflection canvases are not | Large/high-DPR elements increase memory and 2D copy cost | Cap or make destination DPR configurable after visual benchmarking |

The existing visibility gating, 15fps throttle, shared GL surface, readback throttle, and last-instance teardown are strong mitigations.

## 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `package.json` / lockfile | Release and packaging contract | 5 changes each in the last 90 days | Test the packed artifact, both import modes, and all scripts |
| `src/MetalFx.tsx` / `src/hooks/` | Coordinate React, DOM, engine, glow, reflection, and observers | Recent hydration, no-glow, and fallback lifecycle work | Require lifecycle, SSR, and browser tests for ownership changes |
| `demo/components/Examples.tsx` / `Playground.tsx` | Showcase and manual validation surface | 4 and 3 changes in the last 90 days | Keep demo assertions aligned with public API behavior |
| Renderer/glow geometry | Browser/GPU behavior is visual and platform-sensitive | Recent Safari glow fix and performance refactor | Use screenshot baselines across representative browsers and DPRs |

## 6) `[ASK USER]` Questions

1. [ASK USER] Which browser versions are officially supported beyond the Chromium, Firefox, and WebKit versions exercised by Playwright?

## 7) Resolved Hygiene Items

- Biome 2.4.9 is pinned, the formatted tree passes, and `npm run check` is enforced in pull-request CI.
- The stale playground script was removed.
- Hosting redirects moved to the demo and library builds no longer copy the public directory into the npm package.
- Unreferenced/duplicate header assets were removed and public assets are checked for references and duplicate bytes.
- `MetalFx` theme resolution and shared glow registry were extracted; remaining large files have recorded reasons and revisit triggers.
- Module boundaries, explicit public exports, dependency usage, test locations, package contents, and script config references now have executable checks.
- CommonJS now resolves to the generated `dist/index.cjs` bundle, while ESM continues to resolve to `dist/index.es.js`. The packed-artifact fixtures verify ESM named imports, CommonJS `require()`, strict TypeScript public types, and the approved tarball file list on Node 22.x and 24.x through `npm run test:package` and the quality workflow.
- Vitest covers deterministic engine transforms, React lifecycle, fallback behavior, server rendering, and warning-free hydration. Playwright smoke tests normal and forced no-WebGL behavior in Chromium, Firefox, and WebKit with failure traces/screenshots retained by CI. Visual-regression coverage remains a tracked concern.
- `disableGlow` now skips glow SVG injection and renderer registration entirely. Prop transitions remove or recreate one correctly sized glow without recreating the renderer; React lifecycle tests and the cross-browser playground test verify registration, cleanup, and DOM behavior.
- Renderer instances now own their preset and resolved theme. One shared WebGL context plans one pass per active material group, composites it only into matching instances, and captures each group's glow samples before rendering the next group. Homogeneous instances retain one shared pass.
- WebGL, Canvas 2D, shader, and observer initialization failures now release partial resources and render the native child without effect layers. Component and cross-browser tests verify visibility, interaction, retry, and warning-free fallback.
- The development toolchain now uses Vite 8, Vitest 4, vite-plugin-dts 5 with API Extractor 7, and Wrangler 4.110.0. Registry verification, the lockfile audit, and the production-only audit reported zero vulnerabilities on 2026-07-14; Node 22 and 24 both pass the package gate.
- Reflection targets now explicitly track all live owners. The first live owner supplies the reflection; removing it transfers ownership deterministically, while final cleanup removes only MetalFx-created decoration and restores only styles MetalFx still owns.

## 8) Evidence

- `docs/codebase/.codebase-scan.txt`
- `README.md`
- `package.json`
- `package-lock.json`
- `src/MetalFx.tsx`
- `src/engine/renderer/core.ts`
- `src/engine/renderer/loop.ts`
- `demo/components/Examples.tsx`
- `.github/workflows/pages.yml`
- `.github/workflows/publish.yml`
- `.github/workflows/quality.yml`
- `AGENTS.md`
- `repo-hygiene.config.json`
- `scripts/check-hygiene.mjs`
- `tests/package/packed-artifact.mjs`
