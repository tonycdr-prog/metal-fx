/**
 * Shared WebGL renderer — one offscreen GL canvas drives all MetalFx instances.
 *
 * Architecture:
 *   1. A single offscreen GL canvas renders the plasma shader.
 *   2. Each instance owns a visible 2D canvas that receives a cropped/scaled
 *      copy of the GL output with an inner "hole punch" mask (ring effect).
 *   3. Glow sampling reads from a per-instance, material-correct pixel buffer.
 *      The round-robin glow scheduler refreshes only its current target.
 *   4. The animation loop is capped at ~15fps — the blur + slow plasma motion
 *      makes higher rates imperceptible.
 */
import { CANONICAL_GL_SIZE, GL_DPR_CAP } from '../perfConfig';
import { PRESETS, type PresetMode, type PresetName, type PresetTheme } from '../presets';
import { compileShader, FRAG_SHADER_SRC, linkProgram, VERT_SHADER_SRC } from '../shaders';
export const CANONICAL_PILL_W = 140;
export const CANONICAL_PILL_H = 40;
export const PILL_SHADER_SCALE = 1.6;
export const CIRCLE_SHADER_SCALE = 1.3;

export interface ShaderRGB {
  r: number;
  g: number;
  b: number;
}

export interface MetalFxInstance {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
  cornerRadius: number;
  kind: 'pill' | 'circle';
  ringCssPx: number;
  shaderScale: number;
  opacityMul: number;
  visible: boolean;
  /** Per-instance freeze flag. When true the instance's 2D canvas keeps the
   *  last copied frame; the shared GL loop continues for any other unpaused
   *  instance. */
  paused: boolean;
  /** Set to true after the first successful copyShaderToInstance — so an
   *  instance that mounts already paused still gets one frame painted before
   *  it freezes (otherwise it would render a blank canvas). */
  everCopied: boolean;
  dpr: number;
  /** Master scale multiplier for absolute-pixel internals (glow stroke
   *  widths/blurs, reflection stroke band, etc.). 1 is the baseline. Set to
   *  2 for a CSS-zoomed 2× hero so glow + reflection grow with the layout. */
  scale: number;
  preset: PresetName;
  theme: PresetTheme;
  glowPixels: Uint8Array;
  glowPixelsW: number;
  glowPixelsH: number;
  glowReadbackMs: number;
  onAfterFrame?: () => void;
  /** One-shot callback fired after the very first copyShaderToInstance.
   *  Auto-cleared by the loop so it never fires twice. */
  onFirstCopy?: () => void;
}

export interface SharedRenderer {
  glCanvas: HTMLCanvasElement | OffscreenCanvas;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: Record<string, WebGLUniformLocation | null>;
  preset: PresetMode;
  defaultPresetName: PresetName;
  defaultPresetTheme: PresetTheme;
  presetDirty: boolean;
  contextLost: boolean;
  useOffscreen: boolean;
  startMs: number;
  pausedMs: number;
  pausedAtMs: number | null;
  rafId: number;
  dpr: number;
  instances: Set<MetalFxInstance>;
  frameCount: number;
  glowQueue: MetalFxInstance[];
  glowIdx: number;
  glowSkip: number;
}

export let SHARED: SharedRenderer | null = null;

// Called by ensureSharedRenderer on first init and by the contextrestored
// listener to rebuild GL state after the browser reclaims the context.
let _onContextRestored: (() => void) | null = null;
export function setContextRestoredCallback(cb: (() => void) | null): void {
  _onContextRestored = cb;
}

const UNIFORM_NAMES = [
  'u_resolution',
  'u_time',
  'u_color1',
  'u_color2',
  'u_color3',
  'u_color4',
  'u_color5',
  'u_color6',
  'u_color7',
  'u_alpha1',
  'u_alpha2',
  'u_alpha3',
  'u_alpha4',
  'u_alpha5',
  'u_alpha6',
  'u_alpha7',
  'u_intensity',
  'u_scale',
  'u_direction',
  'u_softness',
  'u_distortion',
  'u_complexity',
  'u_shape',
  'u_vignette',
  'u_vigOpacity',
  'u_blur',
  'u_shaderOpacity'
];

function buildGLPipeline(gl: WebGLRenderingContext): {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: Record<string, WebGLUniformLocation | null>;
} {
  let vert: WebGLShader | null = null;
  let frag: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  try {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SHADER_SRC);
    frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER_SRC);
    program = linkProgram(gl, vert, frag);
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL method, not a React hook
    gl.useProgram(program);

    buffer = gl.createBuffer();
    if (!buffer) throw new Error('metal-fx: gl.createBuffer returned null');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of UNIFORM_NAMES) uniforms[name] = gl.getUniformLocation(program, name);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    return { program, buffer, uniforms };
  } catch (error) {
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vert) gl.deleteShader(vert);
    if (frag) gl.deleteShader(frag);
    throw error;
  }
}

export function ensureSharedRenderer(): SharedRenderer {
  if (SHARED) return SHARED;

  const dpr = Math.min(GL_DPR_CAP, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const size = Math.round(CANONICAL_GL_SIZE * dpr);
  const useOffscreen = typeof OffscreenCanvas !== 'undefined';

  let glCanvas: HTMLCanvasElement | OffscreenCanvas;
  let gl: WebGLRenderingContext | null;

  if (useOffscreen) {
    glCanvas = new OffscreenCanvas(size, size);
    gl = glCanvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false
    }) as WebGLRenderingContext | null;
  } else {
    const htmlCanvas = document.createElement('canvas');
    htmlCanvas.width = size;
    htmlCanvas.height = size;
    gl = (htmlCanvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: true
    }) ?? htmlCanvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    glCanvas = htmlCanvas;
  }
  if (!gl) throw new Error('metal-fx: WebGL not supported');

  const onContextLost = (e: Event) => {
    e.preventDefault();
    if (SHARED) SHARED.contextLost = true;
  };
  const onContextRestored = () => {
    if (!SHARED) return;
    const rebuilt = buildGLPipeline(SHARED.gl);
    SHARED.program = rebuilt.program;
    SHARED.buffer = rebuilt.buffer;
    SHARED.uniforms = rebuilt.uniforms;
    SHARED.presetDirty = true;
    SHARED.contextLost = false;
    _onContextRestored?.();
  };
  let pipeline: ReturnType<typeof buildGLPipeline> | null = null;
  try {
    pipeline = buildGLPipeline(gl);
    glCanvas.addEventListener('webglcontextlost', onContextLost as EventListener, false);
    glCanvas.addEventListener('webglcontextrestored', onContextRestored as EventListener, false);

    SHARED = {
      glCanvas,
      gl,
      ...pipeline,
      preset: PRESETS.chromatic.modes.dark,
      defaultPresetName: 'chromatic',
      defaultPresetTheme: 'dark',
      presetDirty: true,
      contextLost: false,
      useOffscreen,
      startMs: performance.now(),
      pausedMs: 0,
      pausedAtMs: null,
      rafId: 0,
      dpr,
      instances: new Set(),
      frameCount: 0,
      glowQueue: [],
      glowIdx: 0,
      glowSkip: 0
    };
    return SHARED;
  } catch (error) {
    glCanvas.removeEventListener('webglcontextlost', onContextLost as EventListener, false);
    glCanvas.removeEventListener('webglcontextrestored', onContextRestored as EventListener, false);
    if (pipeline) {
      gl.deleteBuffer(pipeline.buffer);
      gl.deleteProgram(pipeline.program);
    }
    try {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      // Best-effort cleanup for incomplete or browser-rejected contexts.
    }
    throw error;
  }
}

export function teardownSharedRenderer(): void {
  if (!SHARED) return;
  const { gl, program, buffer } = SHARED;
  try {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* swallow */
  }
  SHARED = null;
}
