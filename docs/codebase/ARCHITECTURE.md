# Architecture

## 1) Architectural Style

- Primary style: a React adapter over a capability-oriented browser rendering engine.
- Classification evidence: `MetalFx` owns React/DOM lifecycle while renderer, glow, and reflection folders isolate separate graphics responsibilities.
- Primary constraints: one shared WebGL context and animation loop; per-instance 2D canvases; browser-only observers and frame APIs; SSR must avoid touching `document` during module evaluation.

## 2) System Flow

```text
MetalFx props -> layout measurement -> shared WebGL frame -> per-instance 2D ring copy
             -> sampled SVG glow -> optional target reflection canvases -> browser paint
```

1. `MetalFx` resolves theme, measures its wrapper, creates a visible canvas, and registers an engine instance.
2. `ensureSharedRenderer` lazily creates one 96px-base WebGL surface, compiles the shader, and stores global GL state.
3. The shared RAF loop renders at a 66ms interval (approximately 15 fps), grouping active instances by preset and resolved theme while skipping hidden or fully paused instances.
4. Each active group receives one shader pass; matching instances receive a cropped copy on their own 2D canvas, then the center is removed with `destination-out` to form a ring.
5. A round-robin callback captures one target instance's group-correct throttled `gl.readPixels` buffer and moves/tints that instance's SVG glow.
6. Dark-mode instances with reflection targets schedule a separate throttled paint that mirrors the anchor canvas into injected target canvases.

## 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| `src/MetalFx.tsx` | Props, refs, effects, observers, sizing, DOM tree | Low-level GL or geometry math | `src/MetalFx.tsx` |
| `renderer/core.ts` | GL pipeline and singleton resource state | React lifecycle | `src/engine/renderer/core.ts` |
| `renderer/loop.ts` | Instances, RAF, uniforms, canvas copying | Glow SVG construction | `src/engine/renderer/loop.ts` |
| `renderer/sampling.ts` | GL-buffer readback and coordinate sampling | Target DOM mutation | `src/engine/renderer/sampling.ts` |
| `glow/` | Perimeter geometry and sampled SVG effects | Shared preset selection | `src/engine/glow/*.ts` |
| `reflection/` | Target decoration, observation, geometry, and painting | React rendering | `src/engine/reflection/*.ts` |

## 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Lazy singleton | `renderer/core.ts` (`SHARED`) | Shares one expensive GL context/program across all instances |
| Registry/set | Renderer instances, glow queue, reflection targets | Coordinates work without React re-renders |
| Adapter/bridge callback | `setGlowCallback` in `MetalFx.tsx` | Keeps the renderer independent of glow implementation details |
| Observer-driven invalidation | `ResizeObserver`, `IntersectionObserver`, `MutationObserver` | Avoids continuous layout/style reads |
| RAF coalescing/throttling | renderer loop, resize handler, reflection scheduler | Bounds browser paint and layout work |

## 5) Known Architectural Risks

- Browser capability failures are thrown from layout setup. Since the wrapper stays hidden until `onFirstCopy`, missing WebGL or 2D canvas support can hide the interactive child instead of degrading gracefully.
- `theme="auto"` resolves to dark on the server but reads `matchMedia` during the first client render, creating a possible hydration mismatch; `useLayoutEffect` also emits a React SSR warning.
- Module-level registries/listeners make initialization order and cleanup important. The design handles last-instance GL teardown, but the behavior needs lifecycle tests.

## 6) Evidence

- `src/index.ts`
- `src/MetalFx.tsx`
- `src/engine/renderer/core.ts`
- `src/engine/renderer/loop.ts`
- `src/engine/renderer/sampling.ts`
- `src/engine/glow/glow.ts`
- `src/engine/reflection/paint.ts`
- `demo/components/Examples.tsx`
