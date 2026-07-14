# Codebase Structure

## 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `src/` | Published React component, public types, injected styles, and rendering engine | `src/index.ts`, `vite.config.ts` |
| `src/engine/renderer/` | Shared WebGL state, animation loop, per-instance compositing, and pixel sampling | `src/engine/renderer/*.ts` |
| `src/engine/glow/` | SVG halo geometry and luminance-driven animation | `src/engine/glow/*.ts` |
| `src/engine/reflection/` | Target registration, observation, geometry, scheduling, and canvas painting | `src/engine/reflection/*.ts` |
| `src/hooks/` | Focused React adapters for renderer lifecycle and theme resolution | `src/hooks/*.ts` |
| `demo/` | Vite/Tailwind interactive showcase importing library source directly | `demo/main.tsx`, `demo/components/Playground.tsx` |
| `.github/workflows/` | GitHub Pages deployment and npm publication | `.github/workflows/*.yml` |
| `scripts/` | Executable repository and package hygiene gates | `scripts/check-hygiene.mjs`, `scripts/check-package.mjs` |
| `repo-hygiene.config.json` | Reviewed large-file exceptions and hygiene configuration | `repo-hygiene.config.json` |
| `docs/codebase/` | Evidence-backed repository analysis | `docs/codebase/*.md` |

## 2) Entry Points

- Main package entry: `src/index.ts`, selected by `vite.config.ts` and exposed through `package.json`.
- React entry: `MetalFx` from `src/MetalFx.tsx`.
- Power-user entry surface: renderer lifecycle and preset primitives re-exported by `src/index.ts`.
- Demo entry: `demo/main.tsx`, selected from `demo/index.html` by `vite.config.demo.ts`.
- Secondary worker/CLI/job entry points: none.

## 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `src/MetalFx.tsx` | Public React props, focused synchronization effects, and DOM composition | Shader math or renderer initialization transactions |
| `src/hooks/` | React-to-engine mount lifecycle and browser theme subscriptions | Shader math or public package exports |
| `src/engine/renderer/` | Shared GL resources, frame scheduling, copying, sampling | React component state |
| `src/engine/glow/` | Glow geometry, SVG markup, and sampled animation | Shared renderer initialization |
| `src/engine/reflection/` | Reflection targets and target-side drawing | Public React prop definitions |
| `src/styles.ts` | Package-injected CSS | Demo-only page layout |
| `demo/` | Showcase UI and controls | Published package implementation |

## 4) Naming and Organization Rules

- React components use PascalCase filenames (`MetalFx.tsx`, `Playground.tsx`); engine modules use lower camelCase or simple lowercase (`perfConfig.ts`, `reflectionScheduler.ts`, `geometry.ts`).
- The engine is organized first by capability (`renderer`, `glow`, `reflection`), then by responsibility within each capability.
- Library imports are relative. The `@` alias maps only to `demo/` via `vite.config.demo.ts` and `demo/tsconfig.json`.
- `src/index.ts` is the explicit public export surface; the Biome configuration forbids broad barrel and re-export-all patterns.

## 5) Evidence

- `docs/codebase/.codebase-scan.txt`
- `src/index.ts`
- `src/MetalFx.tsx`
- `src/engine/renderer/loop.ts`
- `vite.config.ts`
- `vite.config.demo.ts`
