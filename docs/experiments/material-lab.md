# Material Lab (experimental)

The Material Lab is a demo-only review surface for assessing treatments and interactions using the published `MetalFx` API. It does not add a library material system, shader, or public prop.

Open it on GitHub Pages with:

```text
/metal-fx/?material-lab=1
```

The foundation fixture is fully query-selected so a reviewer can share an exact state:

```text
/metal-fx/?material-lab=1&fixture=foundation&recipe=copper&preview=circle&preset=gold&theme=light&strength=62&paused=1
```

Supported foundation values are:

- `fixture=foundation`
- `recipe=molten-chrome|brushed-metal|mercury|holographic|copper|obsidian|electric-plasma`
- `preview=pill|circle|content`
- `preset=chromatic|silver|gold`
- `theme=dark|light`
- `strength=0..100`
- `paused=0|1`
- `interaction=off|pointer-position|pointer-velocity|press-hold|scroll-response|proximity-response|idle-breathing`
- `environment=studio-sweep|warm-cool-split|moving-softbox|dark-tunnel|spectral-wash`

Malformed values fall back to the molten-chrome foundation state. The lab deliberately mounts one live `MetalFx` preview. Its controls exercise only documented props: preset, theme, strength, circle/button shape, and pause. Treatments vary those native controls and deliberately separated stage, card, type, and background presentation rather than claiming new shader features.

`?visual-test=1` remains a separate deterministic visual-regression scene. It takes precedence if both query flags are present.

The Lab honours `prefers-reduced-motion` by pausing the preview and disabling its optional glow. The media-query subscription is owned by the lab hook and is removed on unmount.

Interaction modes are demo-local stage movement only. Pointer and scroll signals are bounded, coalesced through a single requestAnimationFrame, and cancel their pending work on pointer exit, cancellation, hidden-page transitions, mode changes, and unmount. Idle breathing uses a CSS animation rather than a persistent JavaScript frame loop.

The lighting environments are CSS stage treatments. They are not MetalFx shaders. The nearby target uses the public `reflectionTargets` prop in dark mode only; ownership remains with MetalFx and is released by its existing lifecycle cleanup. Animated environment classes are removed whenever the preview is paused, the page is hidden, reduced motion is requested, or the Lab unmounts.

## Evidence fixture and characterization

The deterministic screenshot fixture is the holographic, dark, paused Lab state above, captured by `tests/e2e/material-lab-visual.spec.ts` in the dedicated Chromium project. It freezes RAF time, waits for fonts and the live canvas, disables CSS animation/transition, and captures only the stage. Its measured 1,000-pixel allowance absorbs cross-platform text rasterization differences while retaining material and geometry coverage. Update it with `npx playwright test tests/e2e/material-lab-visual.spec.ts --project=chromium-material-lab-visual --update-snapshots`, then run the non-update command three consecutive times before committing.

Observed characteristics from the fixture and browser smoke coverage: the Lab mounts one live preview; it therefore produces one active material group. The `paused=1` fixture holds its last composited frame, while hidden and reduced-motion states remove the Lab-owned environment animation and interaction work. Reflection target cleanup remains owned by the library's existing target lifecycle. Canvas DPR dimensions are characterized separately by `tests/e2e/scheduling-dpr.spec.ts` at DPR 1 and 3; this experiment does not introduce a new canvas size policy.
