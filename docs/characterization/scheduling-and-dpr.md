# Renderer Scheduling and DPR Characterization

This document records the measured scheduling model and the enforced backing-buffer budget. It is not a guarantee that every GPU produces byte-identical pixels.

## Scheduling model

The renderer owns one shared RAF loop. On each eligible render it plans active material groups, renders the shader once per group, and copies that group's frame into every active instance canvas. Hidden instances and paused instances that already received their first copy are omitted from the plan. An initially paused instance remains eligible exactly until that initial copy completes. If no visible instance needs work, the next scheduled callback settles with no draw and leaves the loop idle; visibility or pause changes that make work eligible schedule it again.

`src/engine/renderer/loop.test.ts` drives captured RAF callbacks directly. It records one `drawArrays` call for two homogeneous instances, one initial destination copy for an initially paused instance, no continuing copies after pause/offscreen idling, and resumed work when an instance is unpaused or visible again. It also verifies an active instance continues while a sibling is hidden. These are operation-count assertions, not elapsed-time measurements.

## Chromium DPR measurements

`tests/e2e/scheduling-dpr.spec.ts` creates isolated Chromium contexts at device scale factors 1 and 3. An `addInitScript` wrapper records only test-run canvas creation; production code exposes no instrumentation.

| Surface | DSF 1 | DSF 3 | Observation |
|---|---:|---:|---|
| Shared WebGL surface | 96×96 | 192×192 | The 96 CSS-pixel canonical surface caps at DPR 2. |
| Circle destination (40×40 CSS px) | 40×40 | 80×80 | Destination backing dimensions cap at DPR 2. |
| Pill destination (140×40 CSS px) | 140×40 | 280×80 | Shape does not alter the DPR rule; only CSS dimensions differ. |
| Reflection backing canvas | target-dependent | target-dependent, approximately 2× its DSF-1 allocation | Reflection backing includes observer-derived overscan and caps at DPR 2; one backing pixel can vary with fractional layout rounding. |

At DSF 3, the cap reduces destination and reflection pixel allocation by about 56% compared with uncapped 3× backing (`2² / 3²`). DOM bounds may not include reflection overscan, so those backing dimensions can remain slightly larger than displayed CSS bounds multiplied by the capped DPR.

## Glow budget

Glow movement is eligible at most every 250ms per instance. Each renderer frame updates no more than three eligible glows and advances a round-robin cursor. At the characterized 15fps renderer cadence, 25 continuously visible instances receive a glow turn within at most nine rendered frames (about 600ms) while per-frame SVG rasterization work stays bounded. Hidden and paused instances consume no update slot.

## Preserved invariants

- The DPR cap changes backing resolution only; CSS layout dimensions remain unchanged.
- Material-group pass bounds, the initial paused copy, visibility restart, and all-idle settlement remain covered.
- The deterministic visual fixtures and cross-browser smoke tests remain the acceptance gate for perceptible regressions.
