# RFC 0001: Material tokens

- Status: Draft
- Date: 2026-07-16
- Discussion: PR thread for this document
- Related: #32 (environment honesty), #33 (finish legibility), #34 (public fallback signal)

## Summary

Formalize the axes that define how metal-fx renders — `preset × finish × strength × scale × theme` — into a small, JSON-serializable **material token** schema, ship a curated registry of named materials, and accept them through a single `material` prop. This is the first step of the agreed direction: metal-fx grows into a **material system that composes with existing design systems** (shadcn, Radix, plain Tailwind), not a design system of its own.

## Motivation

Today the material vocabulary exists twice, informally:

- The component API exposes the axes as loose props (`preset`, `finish`, `strength`, `scale`, `theme`), each individually documented but with no named combinations.
- The Material Lab defines seven curated treatments (Molten chrome, Brushed metal, Mercury, Holographic, Copper, Obsidian, Electric plasma) as demo-local recipe objects that cannot be imported by consumers.

Integrators who want "the Obsidian look" must screenshot the Lab and transcribe five prop values. Design tools, documentation, and non-React consumers (the engine primitives are already exported for them) have no stable, serializable description of a material. Tokens close that gap and become the contract we hold stable while the rendering evolves underneath.

## Guide-level explanation

A **material** is the renderer-affecting description of a metal-fx surface:

```ts
interface MetalFxMaterial {
  /** Color tuning. Existing preset registry. */
  preset: MetalFxPreset; // 'chromatic' | 'silver' | 'gold'
  /** Physical surface response. Existing finish registry. */
  finish: MetalFxFinish; // 'polished' | 'brushed' | 'molten' | 'holographic'
  /** Rendered alpha of ring + glow, canonical unit 0..1. */
  strength: number;
  /** Master pixel-scale multiplier. Optional; default 1. */
  scale?: number;
  /** Pin a theme side. Optional; default 'auto'. */
  theme?: MetalFxTheme;
}
```

Deliberately **excluded** from the material:

- `variant`, `borderRadius`, `shaderScale`, `ringCssPx` — geometry of the host, not identity of the material.
- `interactive`, `paused`, `disableGlow`, `reflectionTargets` — behavioral/context modifiers applied where the material is used.
- The Lab's presentation fields (backdrop, stage surface, content color) and **environments** — these are demo staging, not renderer inputs, and stay out of the token schema at least until #32 resolves whether environments become real lighting.

Named materials ship as a registry, promoted from the Lab recipes:

```ts
import { MATERIALS } from '@tonycdr-prog/metal-fx';

MATERIALS['obsidian'];
// { preset: 'silver', finish: 'polished', strength: 0.66, theme: 'dark' }
```

And the component accepts either a name or an object, with explicit props winning:

```tsx
<MetalFx material="obsidian">…</MetalFx>
<MetalFx material="obsidian" strength={0.4}>…</MetalFx>   // override one axis
<MetalFx material={{ preset: 'gold', finish: 'brushed', strength: 0.88 }}>…</MetalFx>
```

Precedence is `explicit prop > material field > component default`, so `material` is sugar with zero breaking change: every current usage keeps working, and the demo's recipes migrate to consume the exported registry so there is one source of truth.

## Reference-level explanation

### Schema and validation

- `MetalFxMaterial` is plain data: JSON-serializable, no functions, no refs. A JSON Schema ships alongside the TS type for design tooling and docs generation.
- `strength` is canonically **0..1** (matching the component). The Lab's URL state and UI continue to display 0–100 but convert at the boundary; token definitions never store percentages.
- Token names are kebab-case (`molten-chrome`), matching the Lab's recipe ids and URL params.
- Unknown fields are rejected by the type and ignored at runtime (forward compatibility for additive axes).

### Initial registry (tier 1 unless noted)

| token | preset | finish | strength | theme |
| --- | --- | --- | --- | --- |
| `molten-chrome` | chromatic | molten | 1.0 | dark |
| `brushed-metal` | silver | brushed | 0.76 | light |
| `mercury` | silver | polished | 0.94 | dark |
| `holographic` | chromatic | holographic | 0.92 | dark |
| `copper` | gold | brushed | 0.88 | dark |
| `obsidian` | silver | polished | 0.66 | dark |
| `electric-plasma` | chromatic | molten | 1.0 | dark |

`electric-plasma` and `molten-chrome` differ today only by Lab staging; before shipping, either differentiate them on a renderer axis or demote one to the Lab. A token that renders identically to another is not a token.

### Stability contract

- **Tier 1 (stable):** the five axes above, the registry names, and precedence rules. Adding a token or axis is a minor release. Removing or renaming a token is a major release.
- **Tier 2 (experimental, may change in minors):** interactive-lighting parameters, any environment/backdrop concept (blocked on #32), additional finish parameters surfaced from `FinishProfile`.
- **Appearance changes:** a change that visibly alters a tier-1 token's rendered output requires a Chromium visual-baseline update in the same PR and a changelog entry naming the token. Silent drift of a named material is treated as a regression.
- **Fallback:** every tier-1 token must degrade acceptably when WebGL is unavailable, and the fallback state must be observable through a public signal (#34) so integrators can adjust. Until #34 lands, the `data-fallback` attribute is the documented interim signal.
- **Legibility:** every tier-1 token must be visually distinguishable from every other at 1× on the reference pill in the Lab (#33 defines the mechanism — scale exposure and/or larger reference object).

### Implementation sketch

1. `src/engine/materials.ts` — schema type, registry data, `resolveMaterial(nameOrObject, explicitProps)` helper. Pure data + pure function; no React, matching engine-module rules.
2. `src/MetalFx.tsx` — accept `material?: MetalFxMaterialName | MetalFxMaterial`, resolve before existing prop handling. No renderer changes.
3. `src/index.ts` — export `MATERIALS`, `MetalFxMaterial`, `MetalFxMaterialName`.
4. Demo — `demo/material-lab/recipes.ts` re-derives its recipe state from `MATERIALS` plus presentation-only fields, deleting the duplicated axis values.
5. Tests — unit tests for precedence and validation co-located with `materials.ts`; one Lab e2e asserting a named token deep-link renders the same state as the equivalent explicit-prop URL.

Estimated core surface: well under the 250-line module gate; no new dependencies; shared-renderer and settled-idling invariants untouched.

## Drawbacks

- A second way to express the same props — mitigated by making `material` pure sugar with clear precedence.
- Named appearances harden into API. That is the point, but it converts casual shader tweaks into changelog events; the team must be willing to pay that cost.
- Curated tokens embed taste. A bad initial set is costly to remove (major release). Mitigation: launch with the seven Lab-proven names only.

## Alternatives

- **Separate `@tonycdr-prog/metal-fx-materials` package.** Keeps core lean, but the registry is ~1 KB of data and `PRESETS`/`FINISHES` already live in core; a second package adds release friction with no isolation benefit today. Revisit if the registry grows past tens of tokens or gains tooling.
- **CSS-variable-driven tokens.** Attractive for theming pipelines, but the axes drive a WebGL renderer, not CSS; a custom-property bridge can be layered later without changing the schema.
- **Do nothing.** The Lab already demonstrates the vocabulary; but every integrator keeps hand-copying prop tuples, and nothing stops named looks from drifting silently.

## Open questions

1. Does `theme` belong in the material, or is it always the host app's concern? (Current lean: optional pin, omitted = follow app.)
2. Should `strength` be renamed in the schema (e.g. `intensity`) or kept aligned with the prop? (Current lean: keep `strength`; schema/prop parity beats naming taste.)
3. How do `electric-plasma` / `molten-chrome` get differentiated — new renderer axis, tuned values, or demotion?
4. Do we version the registry independently (a `materialsVersion` export) so tools can detect additions without a package bump inspection?

## Rollout

1. Land this RFC (discussion happens on the PR).
2. Implement schema + registry + `material` prop behind the existing API (minor release).
3. Migrate Lab recipes to the registry; add the deep-link equivalence e2e.
4. Resolve #33 (legibility mechanism) and #34 (fallback signal) as tier-1 prerequisites; #32 decides whether environments ever become tokens.
5. Publish integration recipes (shadcn/Radix/Tailwind) written against token names, not prop tuples.
