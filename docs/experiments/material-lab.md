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

Malformed values fall back to the molten-chrome foundation state. The lab deliberately mounts one live `MetalFx` preview. Its controls exercise only documented props: preset, theme, strength, circle/button shape, and pause. Treatments vary those native controls and deliberately separated stage, card, type, and background presentation rather than claiming new shader features.

`?visual-test=1` remains a separate deterministic visual-regression scene. It takes precedence if both query flags are present.

The Lab honours `prefers-reduced-motion` by pausing the preview and disabling its optional glow. The media-query subscription is owned by the lab hook and is removed on unmount.
