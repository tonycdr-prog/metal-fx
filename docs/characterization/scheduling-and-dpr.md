# Renderer Scheduling and DPR Characterization

This document records current behavior; it does not introduce an optimization or a support guarantee.

## Scheduling model

The renderer owns one shared RAF loop. On each eligible render it plans active material groups, renders the shader once per group, and copies that group's frame into every active instance canvas. Hidden instances and paused instances that already received their first copy are omitted from the plan. An initially paused instance remains eligible exactly until that initial copy completes. If no visible instance needs work, the next scheduled callback settles with no draw and leaves the loop idle; visibility or pause changes that make work eligible schedule it again.

`src/engine/renderer/loop.test.ts` drives captured RAF callbacks directly. It records one `drawArrays` call for two homogeneous instances, one initial destination copy for an initially paused instance, no continuing copies after pause/offscreen idling, and resumed work when an instance is unpaused or visible again. It also verifies an active instance continues while a sibling is hidden. These are operation-count assertions, not elapsed-time measurements.

## Chromium DPR measurements

`tests/e2e/scheduling-dpr.spec.ts` creates isolated Chromium contexts at device scale factors 1 and 3. An `addInitScript` wrapper records only test-run canvas creation; production code exposes no instrumentation.

| Surface | DSF 1 | DSF 3 | Observation |
|---|---:|---:|---|
| Shared WebGL surface | 96×96 | 192×192 | The 96 CSS-pixel canonical surface caps at DPR 2. |
| Circle destination (40×40 CSS px) | 40×40 | 120×120 | Destination backing dimensions follow the full device scale factor. |
| Pill destination (140×40 CSS px) | 140×40 | 420×120 | Shape does not alter the DPR rule; only CSS dimensions differ. |
| Reflection backing canvas | target-dependent | target-dependent, approximately 3× its DSF-1 allocation | Reflection backing includes observer-derived overscan. For a 235×40 displayed canvas the captured backing buffer was 237×42 at DSF 1 and about 711×126 at DSF 3; one backing pixel can vary with fractional layout rounding. |

Destination and reflection canvases are currently uncapped. The reflection result is intentionally recorded as current behavior: DOM bounds may not include its overscan, so backing dimensions can be larger than the displayed canvas dimensions multiplied by DPR.

## Risks and follow-up candidates

- High-DPR destination and reflection surfaces grow quadratically in memory; this PR does not cap them.
- A follow-up optimization should first define acceptable visual error for a destination/reflection DPR cap, then compare fixed representative screenshots and memory calculations at DSF 2 and 3.
- A follow-up adaptive scheduler should preserve the tested material-group pass bound, initial paused copy, visibility restart, and all-idle loop settlement as explicit acceptance criteria.
