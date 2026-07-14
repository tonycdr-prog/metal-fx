# External Integrations

## 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|--------|------|---------|------------|-------------|----------|
| Browser WebGL + Canvas APIs | Client runtime | Shader generation, per-instance rings, sampling, reflections | None | High | `src/engine/renderer/*.ts`, `src/engine/reflection/paint.ts` |
| Browser frame/observer APIs | Client runtime | Animation, sizing, visibility, theme, and target-style invalidation | None | High | `src/MetalFx.tsx`, `src/engine/reflection/observers.ts` |
| npm registry | Package distribution | Publishes tagged releases with provenance | `NPM_TOKEN` GitHub secret + OIDC provenance | High | `.github/workflows/publish.yml` |
| GitHub Pages | Public static hosting | Deploys the demo to `https://tonycdr-prog.github.io/metal-fx/` only after Quality succeeds on `main` | GitHub Actions OIDC permissions | Medium | `.github/workflows/pages.yml`, `.github/workflows/quality.yml`, `vite.config.demo.ts` |
| Cloudflare Pages | Optional static hosting | Manual `npm run deploy` path via Wrangler | Wrangler account authentication outside repo | Low | `package.json` |

No runtime HTTP APIs, databases, queues, analytics, or observability services were found.

## 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| None | The package keeps only in-memory renderer/DOM state | Module-level maps, sets, and refs | State is page-local and disappears on reload | `src/MetalFx.tsx`, `src/engine/renderer/core.ts` |

## 3) Secrets and Credentials Handling

- Runtime credential sources: none.
- Release credential: `secrets.NPM_TOKEN` is injected only into the npm publish step.
- No hardcoded secret or environment-variable read was found in source/config searches.
- Rotation/lifecycle: managed outside this repository; [TODO] for team policy.

## 4) Reliability and Failure Behavior

- Network retry/backoff/timeouts/circuit breakers: not applicable to the runtime; it makes no network calls.
- WebGL context loss is detected, rendering pauses, and the shader pipeline is rebuilt on `webglcontextrestored`.
- Page visibility stops/restarts the shared RAF, and intersection visibility suppresses per-instance work.
- WebGL/canvas creation failures throw; there is no visual fallback that preserves the child as visible.

## 5) Observability for Integrations

- Runtime logging: none.
- Metrics/tracing: none.
- GitHub Actions provides build/deploy logs, but there is no browser error/performance telemetry.
- The demo uses a relative Vite base so the same artifact works at the Pages project subpath and a future custom domain.
- Missing visibility: WebGL initialization/context-loss frequency and client render failures cannot be observed by the library itself.

## 6) Evidence

- `src/engine/renderer/core.ts`
- `src/engine/renderer/loop.ts`
- `src/MetalFx.tsx`
- `.github/workflows/publish.yml`
- `.github/workflows/pages.yml`
- `package.json`
