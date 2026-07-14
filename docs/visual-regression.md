# Visual Regression Baseline

The visual foundation has one required Chromium screenshot. It exercises the query-selected demo scene at `/metal-fx/?visual-test=1`; the normal Pages showcase is unchanged.

Run it with the repository Playwright version:

```bash
npx playwright test tests/e2e/visual.spec.ts --project=chromium-visual
```

The project fixes the viewport to 880×160 at device scale factor 1. Before navigation it fixes RAF timestamps and `performance.now()` to `1000`; the test waits for fonts and all four MetalFx canvases, then disables CSS animation and transition before capture. The screenshot is limited to the dedicated scene and permits at most 0.2% changed pixels (`maxDiffPixelRatio: 0.002`). The first Linux CI comparison differed from the macOS baseline by 199 of 140,800 pixels (0.141%), isolated to text glyph rasterization; the effect and layout pixels matched. The limit allows that observed platform variance with little headroom rather than masking material or layout changes.

To intentionally update the approved baseline, first review the rendered scene and the diff, then run:

```bash
npx playwright test tests/e2e/visual.spec.ts --project=chromium-visual --update-snapshots
```

Run the non-update command three consecutive times before committing an update. Chromium is the only pixel baseline in this foundation. Firefox and WebKit remain semantic WebGL smoke coverage because their independent rendering stacks have not yet shown repeatable pixel parity.
