# Codebase Concerns

Remediation acceptance contract: `spec/spec-process-stabilization-acceptance.md`.

## 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| Medium | Current lockfile audit reports 20 dev-tool vulnerabilities (1 critical, 9 high); production-only audit reports 0 | `package-lock.json`; `npm audit` on 2026-07-14 | Local dev/CI tooling has supply-chain exposure even though consumers do not inherit it | Upgrade Vite/Wrangler/vite-plugin-dts chains deliberately and re-audit |

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Runtime `scale` updates do not rebuild glow or recompute default ring/shader scale | Creation and resize bake derived values; update patch sets only `scale` | `MetalFx.tsx`, `renderer/loop.ts:updateInstance` | Dynamic scale changes only partially apply | Treat scale as an initialization-only prop or recompute every derived value |
| Reviewed large modules remain concentrated | Graphics state machines are inherently detailed | `repo-hygiene.config.json`, `MetalFx.tsx`, engine loop/glow/reflection modules | Future behavior can accumulate inside already dense modules | Honor recorded revisit triggers and require new review entries above 250 nonblank lines |

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Dev dependency advisories | A06: Vulnerable and Outdated Components | `package-lock.json`; local audit result | No bundled production dependencies; production-only audit found 0 | No dependency update automation/security policy found |
| Inline style/SVG markup injection conflicts with strict CSP | N/A | `styles.ts`, `glow/glow.ts` | Markup is library-generated rather than user-supplied | No nonce/external stylesheet option is exposed |
| DOM mutation of reflection targets | N/A | `reflection/paint.ts` | Blocks form-control tags and restores styles it applied | Multiple anchors targeting one element share the first registration without explicit ownership semantics |

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
| `src/MetalFx.tsx` | Coordinates React, DOM, engine, glow, reflection, and observers | 3 changes in the last 90 days; prior invisible-button fix | Add lifecycle/SSR/browser tests before splitting hooks |
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
