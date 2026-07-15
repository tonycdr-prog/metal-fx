// ─── Frame rates ──────────────────────────────────────────────────────────

// Main render loop: shader + canvas compositing. 66ms ≈ 15fps.
export const FRAME_INTERVAL_MS = 66;

// Reflection repaint throttle. Matches main loop; CSS blur hides stepping.
export const REFLECTION_INTERVAL_MS = 66;

// ─── Glow ─────────────────────────────────────────────────────────────────

// gl.readPixels interval for luminance sampling. GPU→CPU sync is expensive.
export const GLOW_READBACK_INTERVAL_MS = 1500;

// Keep individual halo motion smooth enough without re-rasterizing every SVG
// on every 15 fps renderer tick. A bounded batch prevents large mount counts
// from turning one frame into unbounded main-thread style work.
export const GLOW_UPDATE_INTERVAL_MS = 250;
export const GLOW_MAX_UPDATES_PER_FRAME = 3;

// Points sampled around the perimeter to find the brightest hotspot.
export const PERIM_SAMPLES = 16;

// SVG path segment counts. Lower = shorter d-strings = less SVG parse work.
// Blur filters smooth out any polygon faceting.
export const HALO_SEGMENTS = 16;
export const EXTRA_SEGMENTS = 8;

// ─── GL canvas ────────────────────────────────────────────────────────────

// Base pixel size of the offscreen GL canvas (before DPR scaling).
// The plasma is inherently blurry — higher values waste fragment work.
export const CANONICAL_GL_SIZE = 96;

// Cap devicePixelRatio for the GL canvas. 3x retina is wasted on soft plasma.
export const GL_DPR_CAP = 2;

// Destination and reflection canvases are also soft/composited surfaces. A
// common cap avoids quadratic backing-buffer growth on 3x+ displays.
export const COMPOSITE_DPR_CAP = 2;
