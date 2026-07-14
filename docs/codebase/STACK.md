# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript/TSX; the library compiler range is `^5.3.0` and the lock currently resolves TypeScript 5.9.3 | `package.json`, `package-lock.json` |
| Runtime + version | Browser DOM, Canvas 2D, SVG, and WebGL; CI uses Node 20. The supported consumer Node/browser matrix is [TODO]. | `src/MetalFx.tsx`, `src/engine/renderer/core.ts`, `.github/workflows/*.yml` |
| Package manager | npm with lockfile version 3 | `package-lock.json` |
| Module/build system | ESM source; Vite 5 library build emits ES and CommonJS-labelled bundles plus rolled-up declarations | `package.json`, `vite.config.ts` |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| React | `>=18.0.0` peer | Component lifecycle, refs, state, and rendering | `package.json`, `src/MetalFx.tsx` |
| React DOM | `>=18.0.0` peer | Consumer rendering peer; used by the demo | `package.json`, `demo/main.tsx` |

There are no bundled runtime `dependencies`; React and React DOM are externalized peers.

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| TypeScript 5 | Strict type checking and declaration generation | `tsconfig.json`, `tsconfig.build.json` |
| Vite 5 + React plugin | Library and demo builds/dev server | `vite.config.ts`, `vite.config.demo.ts` |
| `vite-plugin-dts` | Rolled-up `dist/index.d.ts` | `vite.config.ts` |
| Tailwind CSS 4 | Demo styling only | `demo/tailwind.css`, `vite.config.demo.ts` |
| Biome 2.4.9 | Pinned formatter/linter enforced by npm scripts and pull-request CI | `biome.json`, `package.json`, `.github/workflows/quality.yml` |
| Wrangler 4 | Optional Cloudflare Pages deployment | `package.json` |
| GitHub Actions | Demo deployment and npm publishing | `.github/workflows/pages.yml`, `.github/workflows/publish.yml` |

## 4) Key Commands

```bash
npm ci
npm run dev
npm run check
npm run lint
npm run hygiene
npm run typecheck
npm run build
npm run build:demo
npm run deploy
```

There is no automated behavior-test command yet. `npm run check` enforces formatting, linting, repository hygiene, library/demo type checks and builds, and packed-file contents.

## 5) Environment and Config

- Config sources: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `vite.config.ts`, `vite.config.demo.ts`, `biome.json`.
- Required runtime env vars: none found; there is no env template and no environment-variable read in `src/` or `demo/`.
- Release credential: the npm workflow reads `secrets.NPM_TOKEN` from GitHub Actions.
- Deployment/runtime constraints: the effect requires client-side browser APIs and WebGL; the intended supported browser/Node matrix is [TODO].

## 6) Evidence

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `vite.config.demo.ts`
- `.github/workflows/pages.yml`
- `.github/workflows/publish.yml`
- `docs/codebase/.codebase-scan.txt`
