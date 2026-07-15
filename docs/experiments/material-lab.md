# Material Lab (experimental)

The Material Lab is a demo-only review surface for assessing published `MetalFx` finishes, palettes, and demo lighting environments. The finish selector drives the real renderer; the surrounding stage remains presentation-only.

Open it on GitHub Pages with:

```text
/metal-fx/?material-lab=1
```

The foundation fixture is fully query-selected so a reviewer can share an exact state:

```text
/metal-fx/?material-lab=1&fixture=foundation&recipe=holographic&environment=spectral-wash&finish=holographic&interactive=0&preview=pill&preset=chromatic&theme=dark&strength=92&paused=1
```

Supported foundation values are:

- `fixture=foundation`
- `recipe=molten-chrome|brushed-metal|mercury|holographic|copper|obsidian|electric-plasma`
- `finish=polished|brushed|molten|holographic`
- `interactive=0|1`
- `preview=pill|circle|content`
- `preset=chromatic|silver|gold`
- `theme=dark|light`
- `strength=0..100`
- `paused=0|1`
- `environment=studio-sweep|warm-cool-split|moving-softbox|dark-tunnel|spectral-wash`

Malformed values fall back to the selected recipe state. The lab deliberately mounts one live `MetalFx` preview. Its controls exercise only documented props: finish, preset, theme, strength, circle/button shape, responsive lighting, and pause. Recipes now select a genuine shader finish as well as their palette and presentation; the lighting environments remain explicitly demo-only CSS stage treatments.

`?visual-test=1` remains a separate deterministic visual-regression scene. It takes precedence if both query flags are present.

The Lab honours `prefers-reduced-motion` by pausing the preview and disabling its optional glow. The media-query subscription is owned by the lab hook and is removed on unmount.

Responsive lighting is a simple opt-in toggle because it drives the real `interactive` renderer prop. Pointer position and press affect shader lighting; keyboard activation uses the centre of the material. The preview stage and wrapped control do not translate.

The lighting environments are CSS stage treatments. They are not MetalFx shaders. The nearby target uses the public `reflectionTargets` prop in dark mode only; ownership remains with MetalFx and is released by its existing lifecycle cleanup. Animated environment classes are removed whenever the preview is paused, the page is hidden, reduced motion is requested, or the Lab unmounts.

## Evidence fixture and characterization

The deterministic screenshot fixture is the holographic, dark, paused Lab state above, captured by `tests/e2e/material-lab-visual.spec.ts` in the dedicated Chromium project. It freezes RAF time, waits for fonts and the live canvas, disables CSS animation/transition, and captures only the stage. Its measured 1,000-pixel allowance absorbs cross-platform text rasterization differences while retaining material and geometry coverage. Update it with `npx playwright test tests/e2e/material-lab-visual.spec.ts --project=chromium-material-lab-visual --update-snapshots`, then run the non-update command three consecutive times before committing.

Observed characteristics from the fixture and browser smoke coverage: the Lab mounts one live preview; it therefore produces one active material group. The `paused=1` fixture holds its last composited frame, while hidden and reduced-motion states remove the Lab-owned environment animation. Reflection target cleanup remains owned by the library's existing target lifecycle. Canvas DPR dimensions are characterized separately by `tests/e2e/scheduling-dpr.spec.ts` at DPR 1 and 3; this experiment does not introduce a new canvas size policy.
