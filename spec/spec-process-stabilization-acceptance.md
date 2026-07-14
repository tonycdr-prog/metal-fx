---
title: Metal FX Stabilization Acceptance Contract
version: 1.0
date_created: 2026-07-14
last_updated: 2026-07-14
owner: Sol reviewer
tags: [process, stabilization, acceptance, testing, release]
---

# Introduction

This specification defines the pass/fail contract for stabilizing `metal-fx` before material expansion, pointer reactivity, or a shared `MetalFxProvider` is implemented. It converts the risks in `docs/codebase/CONCERNS.md` into requirements that an implementation agent can execute and a reviewing agent can verify independently.

## 1. Purpose & Scope

The specification covers correctness, compatibility, graceful degradation, server-side rendering (SSR), lifecycle cleanup, performance invariants, package integrity, code quality, dependency hygiene, and continuous integration.

The intended workflow is:

1. Sol approves or amends this contract.
2. Terra implements one bounded requirement group at a time.
3. Terra supplies commands and results for every applicable acceptance criterion.
4. Sol reviews the diff, repeats risk-sensitive checks, and fixes or rejects deviations.

This specification does not require new visual materials, pointer-reactive behavior, a provider API, or unrelated refactoring.

### 1.1 Working Assumptions

- **ASM-001**: Concurrent `MetalFx` instances are intended to support different `preset` and resolved `theme` values because these are instance props and the demo mounts mixed presets.
- **ASM-002**: CommonJS remains supported because `package.json` currently advertises a `require` export. Removing it is a separate breaking API decision.
- **ASM-003**: If WebGL or Canvas initialization fails, the wrapped child must remain visible and interactive without the effect.
- **ASM-004**: `build:playground` was confirmed stale and removed during repository-hygiene enforcement.
- **ASM-005**: Existing public React props and power-user exports remain source-compatible unless a change is separately approved and versioned.
- **ASM-006**: Runtime support versions must be explicitly declared before release. Package tests shall use the declared minimum Node version and the current project CI version rather than relying on the implementer's local runtime.

## 2. Definitions

- **Material group**: Instances sharing the same shader-affecting preset and resolved theme.
- **Graceful fallback**: Rendering the original child without WebGL, glow, or reflection while preserving layout and interaction.
- **Packed-artifact test**: A test that installs the tarball produced by `npm pack`, rather than importing workspace source or `dist/` directly.
- **SSR**: Rendering React output in a server environment without browser globals.
- **Hydration**: Attaching client React behavior to server-rendered markup.
- **Lifecycle leak**: A remaining RAF callback, observer, DOM decoration, renderer instance, GL resource, or registry entry after unmount.
- **Quality gate**: A command that must pass in pull-request continuous integration before merge.
- **Characterization test**: A test or benchmark that records current behavior without requiring immediate optimization.

## 3. Requirements, Constraints & Guidelines

### 3.1 Correctness and Runtime Resilience

- **REQ-001 — Material isolation**: Each mounted instance shall render the shader preset and resolved theme requested by that instance.
- **REQ-002 — Homogeneous sharing**: Instances in the same material group shall continue to share shader work; the fix shall not regress to one WebGL render per instance.
- **REQ-003 — Graceful fallback**: Renderer initialization and context failures shall not hide, disable, or remove the wrapped child.
- **REQ-004 — SSR stability**: Importing and rendering the package on a server shall not access unavailable browser globals or emit a `useLayoutEffect` SSR warning.
- **REQ-005 — Hydration stability**: `theme="auto"` shall not cause hydration mismatch warnings when the client preference differs from the server default.
- **REQ-006 — Disabled glow semantics**: `disableGlow` shall prevent glow injection, registration, sampling, and per-frame glow updates.
- **REQ-007 — Runtime scale semantics**: A runtime `scale` change shall update every derived absolute-pixel value promised by the public prop documentation, or the prop shall be documented and enforced as immutable after mount.
- **REQ-008 — Reflection ownership**: Multiple anchors targeting the same element shall have deterministic ownership and cleanup behavior; unmounting one anchor shall not remove another live anchor's decoration unexpectedly.
- **REQ-009 — Strict lifecycle cleanup**: Mount, prop update, unmount, and React StrictMode remount cycles shall leave no lifecycle leaks.

### 3.2 Packaging and Compatibility

- **PKG-001 — Valid dual exports**: If both `import` and `require` remain advertised, the packed artifact shall load through both conditions on every declared supported Node version.
- **PKG-002 — Type export integrity**: A TypeScript consumer shall resolve `MetalFx`, its public props, presets, and power-user renderer exports from the packed artifact.
- **PKG-003 — Package contents**: The npm tarball shall contain only files required by consumers, licensing, and package documentation. Hosting-only `_redirects` shall not be included.
- **PKG-004 — Script integrity**: Every npm script shall reference an existing configuration/entry point and complete its stated function.
- **PKG-005 — Compatibility declaration**: The package shall declare or document its supported Node, React, and browser baseline.
- **PKG-006 — Repository asset hygiene**: Demo assets and configuration shall be referenced by the current build or removed; byte-identical duplicates require an explicit documented purpose.

### 3.3 Quality, Security, and Delivery

- **QUA-001 — Reproducible tooling**: Every quality tool used by the repository shall be pinned in the lockfile and exposed through an npm script.
- **QUA-002 — Biome compliance**: The agreed Biome rules shall pass without downloading an undeclared tool at check time. Required tool-specific config files may use narrow documented exceptions.
- **QUA-003 — Automated coverage**: Deterministic engine logic, React lifecycle behavior, SSR/hydration, packed exports, and critical browser behavior shall have automated tests.
- **QUA-004 — Pull-request CI**: Pull requests shall run the complete quality-gate command set and shall not publish or deploy artifacts.
- **SEC-001 — Dependency audit**: The production dependency audit shall report zero known vulnerabilities. Development advisories shall be fixed, explicitly accepted with rationale and review date, or isolated from release execution.
- **SEC-002 — CSP compatibility decision**: Inline style/SVG behavior shall either support a documented Content Security Policy integration path or be explicitly documented as incompatible with strict `style-src` policies.
- **GUD-001 — Refactoring restraint**: File splitting is not an acceptance goal by itself. Refactor only where required to make behavior testable or to satisfy agreed lint rules.
- **GUD-002 — Small changes**: Packaging/tooling, fallback/SSR, glow/scale, material isolation, and CI/tests should be separate review units unless a dependency makes separation impossible.

### 3.4 Performance Characterization

- **PER-001 — Render-pass bound**: A frame shall perform no more shader renders than the number of active material groups requiring work.
- **PER-002 — Visibility and pause preservation**: Offscreen or fully paused instances shall retain the current skip/idling behavior.
- **PER-003 — Glow fairness**: With multiple glow-enabled visible instances, every instance shall receive an update within a documented bounded number of rendered frames.
- **PER-004 — DPR characterization**: Destination and reflection canvas memory/pixel growth shall be measured at device pixel ratios 1, 2, and 3 for representative button and hero sizes before a DPR cap is introduced.

## 4. Interfaces & Data Contracts

### 4.1 Public React Contract

The following existing contract must remain compatible:

```tsx
<MetalFx
  preset="chromatic"
  theme="auto"
  strength={1}
  paused={false}
  disableGlow={false}
  scale={1}
  reflectionTargets={targets}
>
  <button>Action</button>
</MetalFx>
```

- `preset` and resolved `theme` apply only to the receiving instance's visual output.
- `strength` remains clamped to `[0, 1]`.
- `paused` freezes only the receiving instance after it has painted an initial frame.
- `disableGlow` means no glow runtime work for the receiving instance.
- `reflectionTargets` must be cleaned up without destroying unrelated ownership.
- The child remains the interactive element in normal and fallback modes.

### 4.2 Package Export Contract

```json
{
  ".": {
    "import": {
      "types": "<declaration entry>",
      "default": "<ES module entry>"
    },
    "require": {
      "types": "<declaration entry>",
      "default": "<CommonJS entry ending in .cjs>"
    }
  }
}
```

The exact filenames may change, but each condition must resolve to syntax and an extension valid for that module system.

### 4.3 Required Command Contract

The stabilized repository shall expose commands equivalent to:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:browser
npm run test:package
npm run build
npm run build:demo
npm run audit:prod
```

Names may differ only if a single documented `npm run check` command invokes all required gates.

## 5. Acceptance Criteria

### 5.1 Material Isolation and Performance

- **AC-001**: Given simultaneously mounted gold/dark and chromatic/dark instances, when at least three animation frames are painted, then each instance's sampled or screenshot output matches its requested preset and neither changes when the other rerenders.
- **AC-002**: Given simultaneously mounted chromatic/dark and chromatic/light instances, when the system preference or explicit theme changes for one instance, then only that instance's shader mode, glow treatment, and reflection eligibility change.
- **AC-003**: Given ten visible instances in one material group, when one frame is rendered, then instrumentation reports one shader render for that group rather than ten.
- **AC-004**: Given three active material groups, when one frame is rendered, then shader render count is at most three.
- **AC-005**: Given all instances are offscreen or paused after their initial copy, when RAF settles, then the shared loop idles and frame count stops increasing.

### 5.2 Fallback, SSR, and Lifecycle

- **AC-006**: Given `getContext('webgl')` returns `null`, when `MetalFx` mounts, then no uncaught error escapes and the child is visible, focusable, clickable, and laid out at its normal size.
- **AC-007**: Given 2D canvas acquisition fails after WebGL succeeds, when `MetalFx` mounts, then the same graceful fallback behavior as AC-006 applies and allocated shared resources are released if unused.
- **AC-008**: Given a live component loses its WebGL context, when restoration succeeds, then animation resumes without remounting or duplicating resources; when restoration cannot succeed, the child remains usable.
- **AC-009**: Given a Node server environment without `window`, `document`, observers, RAF, WebGL, or Canvas, when the package is imported and rendered to a string, then it throws no error and emits no React SSR warning.
- **AC-010**: Given server output resolved with the deterministic server theme and a client whose media query prefers the opposite theme, when hydration completes, then React emits no hydration mismatch and the component adopts the client theme after hydration.
- **AC-011**: Given React StrictMode mounts, cleans up, and remounts a component, when the final unmount completes, then renderer instance count, glow registry, reflection target set, observers, RAF callbacks, and injected per-instance DOM decorations return to their pre-test state.
- **AC-012**: Given `disableGlow={true}` at mount, when frames render, then no SVG glow is injected, the instance is absent from the glow queue, and no sampling call occurs on its behalf.
- **AC-013**: Given `disableGlow` changes from false to true and back, when effects settle, then registration and DOM state change exactly once per transition without leaks or duplicates.
- **AC-014**: Given two anchors reference the same reflection target, when either anchor unmounts, then the remaining live ownership behaves according to the documented policy and final cleanup restores only styles the library applied.

### 5.3 Packaging and Scripts

- **AC-015**: Given a clean packed tarball installed into a CommonJS fixture, when `require('metal-fx')` runs on each declared supported Node version, then it returns the documented public exports without `ERR_REQUIRE_ESM`.
- **AC-016**: Given the same tarball installed into an ESM fixture, when `import { MetalFx } from 'metal-fx'` runs, then it succeeds on each declared supported Node version.
- **AC-017**: Given a strict TypeScript fixture consuming the tarball, when it type-checks, then component props and power-user exports resolve without workspace path aliases or source files.
- **AC-018**: Given `npm pack --dry-run --json`, when the file list is inspected, then it includes the license, README, package manifest, declarations, and runtime bundles, and excludes `_redirects`, demo assets, source maps not intentionally published, and unrelated files.
- **AC-019**: Given a clean checkout after `npm ci`, when every script in `package.json` is invoked in its intended environment, then no script fails because a referenced repository file is missing.

### 5.4 Quality and Security

- **AC-020**: Given a clean checkout with no global tools, when `npm ci` followed by the repository lint command runs, then the pinned Biome version is used and returns zero errors.
- **AC-021**: Given a pull request, when CI runs, then lint, library and demo type checks, unit/integration tests, browser tests, package tests, library build, demo build, and production audit all complete before merge is allowed.
- **AC-022**: Given a tag publish workflow, when release begins, then the same required quality gates have passed for the tagged commit before `npm publish` executes.
- **AC-023**: Given `npm audit --omit=dev`, when the stabilization change is ready for acceptance, then the result is zero vulnerabilities.
- **AC-024**: Given any remaining development advisory, when Sol reviews it, then the repository records affected package, exposure, mitigation, owner, review date, and expiry; an unexplained high-severity advisory fails acceptance.
- **AC-025**: Given the selected CSP policy decision, when documentation and an automated/example integration are reviewed, then consumers can either configure the supported nonce/stylesheet path or see an explicit compatibility limitation before adoption.

### 5.5 Scale and Performance Characterization

- **AC-026**: Given `scale` changes at runtime from 1 to 2, when the next stable frame renders, then shader sampling scale, ring thickness, glow geometry, and reflection absolute-pixel constants all match the documented 2x behavior; alternatively, changing `scale` after mount produces an explicit development warning and documentation states it is initialization-only.
- **AC-027**: Given visible glow-enabled instances, when rendered frames advance, then each instance receives a glow update within the documented queue bound and the test does not depend on wall-clock flakiness.
- **AC-028**: Given representative 40x40, 140x40, and hero-size instances at DPR 1, 2, and 3, when canvases initialize, then a characterization report records canvas dimensions and estimated pixel memory; no cap is accepted without visual comparison.
- **AC-029**: Given the demo build inputs and source references are enumerated, when repository assets and configuration are audited, then every retained item has a live reference or documented purpose and no unexplained byte-identical duplicate remains.

## 6. Test Automation Strategy

### 6.1 Test Levels

- **Unit**: Color conversion, tweening, geometry, sampling transforms, material grouping, queue behavior, and cleanup bookkeeping.
- **Component integration**: React props, SSR, hydration, StrictMode, observer cleanup, fallback behavior, glow registration, and shared material behavior.
- **Packed artifact**: ESM, CommonJS, and TypeScript fixtures installed from the generated tarball.
- **Browser end-to-end**: Real Chromium, Firefox, and WebKit rendering for mixed presets, theme changes, pause, fallback, context restoration where controllable, reflections, and visual baselines.

### 6.2 Recommended Tool Capabilities

- Use the Vite-native test runner unless a simpler installed primitive meets the requirement.
- Use React DOM's server/client APIs for SSR and hydration checks.
- Use a real multi-browser automation runner for WebGL and screenshot checks; DOM-only emulation is insufficient for final graphics acceptance.
- Use fake timers/RAF only for deterministic scheduling tests, not as the sole proof of browser rendering.
- Package fixtures must install a tarball into temporary isolated directories and must not resolve the workspace package through symlinks.

### 6.3 CI/CD Integration

- Pull-request CI is mandatory for every quality gate.
- Browser tests may be split into a fast required smoke set and a full visual matrix, but mixed presets, fallback, and one screenshot per engine remain required before merge.
- Publish CI shall consume the exact artifact that passed package tests or rebuild deterministically from the same commit after all gates pass.
- Test output shall identify runtime/browser version and retain failed screenshots or traces as artifacts.

### 6.4 Coverage

- No arbitrary repository-wide percentage is required initially.
- Every branch introduced for graceful fallback, material grouping, theme hydration, glow enablement, and reflection ownership must have a focused automated check.
- Pure deterministic modules should reach complete branch coverage where practical; exclusions require a comment explaining why browser validation is the stronger oracle.

## 7. Rationale & Context

The current renderer optimizes homogeneous instances by sharing one shader surface, but its public component API implies independent material selection. Stabilization must preserve sharing without allowing one component's effect to overwrite another's output.

The package currently builds successfully, but build success does not validate conditional exports, SSR behavior, no-WebGL behavior, or browser lifecycle cleanup. Packed-artifact and browser tests are therefore release requirements rather than optional confidence checks.

Mechanical cleanup is deliberately separated from architectural changes. This allows a lower-cost implementation agent to handle bounded work while Sol focuses review effort on material grouping, SSR/hydration, graceful fallback, and lifecycle integrity.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: npm registry package format and conditional exports.
- **EXT-002**: GitHub Actions pull-request and release workflows.
- **EXT-003**: Browser WebGL, Canvas 2D, RAF, media query, and observer APIs.

### Technology Platform Dependencies

- **PLT-001**: React 18 or later, matching the current peer dependency.
- **PLT-002**: Supported Node versions declared by ASM-006 before release acceptance.
- **PLT-003**: Chromium, Firefox, and WebKit-compatible browser automation for final graphics verification.

### Compliance Dependencies

- **COM-001**: MIT license and npm provenance behavior must remain intact.

## 9. Examples & Edge Cases

### 9.1 Mixed Materials

```tsx
<>
  <MetalFx preset="gold" theme="dark"><button>Send</button></MetalFx>
  <MetalFx preset="chromatic" theme="dark"><button>Upgrade</button></MetalFx>
  <MetalFx preset="silver" theme="light"><button>Settings</button></MetalFx>
</>
```

All three instances must retain their own material while still sharing work with any other instance in the same material group.

### 9.2 Fallback

```tsx
<MetalFx>
  <button onClick={submit}>Submit</button>
</MetalFx>
```

If WebGL, Canvas 2D, or shader compilation fails, `Submit` remains visible and `submit` still executes.

### 9.3 Edge Cases

- Component mounts already paused and must paint one initial frame when graphics are available.
- System theme changes while multiple explicit and automatic-theme instances coexist.
- A target ref is initially null, becomes live, changes class/radius, and is later removed.
- All instances unmount and a new instance mounts in the same event-loop turn.
- WebGL context is lost while instances are paused or offscreen.
- Strength is below 0, above 1, or changes while paused.
- Scale changes while reflections and glow are active.
- Strict CSP blocks inline styles in the documented unsupported configuration.

## 10. Validation Criteria

Sol may approve stabilization only when:

1. Every applicable `AC-*` item has an automated check or an explicitly documented manual browser proof.
2. All required npm quality commands pass from a clean checkout after `npm ci`.
3. Packed ESM, CommonJS, and TypeScript fixtures pass on the declared runtime matrix.
4. Mixed-material screenshots pass in Chromium, Firefox, and WebKit.
5. SSR and opposite-theme hydration emit no warnings.
6. No-WebGL fallback preserves the child's visibility, layout, focus, and click behavior.
7. StrictMode/lifecycle instrumentation returns to baseline after final unmount.
8. Performance instrumentation proves homogeneous sharing and the material-group render-pass bound.
9. The production audit reports zero vulnerabilities and all remaining dev advisories have an approved disposition.
10. `docs/codebase/CONCERNS.md` is updated so resolved items are removed or linked to evidence; deferred items retain an owner and rationale.

## 11. Related Specifications / Further Reading

- `docs/codebase/CONCERNS.md`
- `docs/codebase/ARCHITECTURE.md`
- `docs/codebase/TESTING.md`
- `README.md`
- `package.json`
