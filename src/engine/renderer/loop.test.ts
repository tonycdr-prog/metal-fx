import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MetalFxInstance } from './core';
import { createInstance, destroyInstance, setInstanceVisible, updateInstance } from './loop';

type Frame = FrameRequestCallback;

function create2dContext() {
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fill: vi.fn(),
    restore: vi.fn(),
    roundRect: vi.fn(),
    save: vi.fn(),
    set globalAlpha(_value: number) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {},
    set fillStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;
}

function createGl(drawArrays: ReturnType<typeof vi.fn>) {
  return {
    ARRAY_BUFFER: 0,
    BLEND: 1,
    COLOR_BUFFER_BIT: 2,
    COMPILE_STATUS: 3,
    FLOAT: 3.5,
    FRAGMENT_SHADER: 4,
    LINK_STATUS: 5,
    ONE_MINUS_SRC_ALPHA: 6,
    SRC_ALPHA: 7,
    STATIC_DRAW: 8,
    TRIANGLES: 9,
    VERTEX_SHADER: 10,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    blendFunc: vi.fn(),
    bufferData: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    createProgram: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    drawArrays,
    enable: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getExtension: vi.fn(() => null),
    getProgramInfoLog: vi.fn(() => null),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => null),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn(() => null),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn()
  } as unknown as WebGLRenderingContext;
}

function scaleInstance(): MetalFxInstance {
  return {
    kind: 'pill',
    ringCssPx: 1,
    scale: 1,
    shaderScale: 1.6
  } as MetalFxInstance;
}

describe('updateInstance scale', () => {
  it('recomputes default shader sampling and ring thickness for 1 → 2 → 0.5', () => {
    const metal = scaleInstance();

    updateInstance(metal, { scale: 2 });
    expect(metal).toMatchObject({ scale: 2, shaderScale: 3.2, ringCssPx: 2 });

    updateInstance(metal, { scale: 0.5 });
    expect(metal).toMatchObject({ scale: 0.5, shaderScale: 0.8, ringCssPx: 0.5 });
  });

  it('preserves explicit overrides while remaining defaults follow scale', () => {
    const metal = scaleInstance();

    updateInstance(metal, { scale: 2, shaderScale: 5 });
    expect(metal).toMatchObject({ scale: 2, shaderScale: 5, ringCssPx: 2 });

    updateInstance(metal, { scale: 0.5, ringCssPx: 4 });
    expect(metal).toMatchObject({ scale: 0.5, shaderScale: 5, ringCssPx: 4 });

    updateInstance(metal, { scale: 1 });
    expect(metal).toMatchObject({ scale: 1, shaderScale: 5, ringCssPx: 4 });
  });
});

describe('shared renderer scheduling characterization', () => {
  const frames: Frame[] = [];
  const drawArrays = vi.fn();
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  const liveInstances = new Set<MetalFxInstance>();

  function advance(now: number) {
    const frame = frames.shift();
    if (!frame) throw new Error('expected a scheduled animation frame');
    frame(now);
  }

  function instance(paused = false): MetalFxInstance {
    const canvas = document.createElement('canvas');
    const created = createInstance({
      hostCanvas: canvas,
      cssWidth: 140,
      cssHeight: 40,
      cornerRadius: 20,
      kind: 'pill',
      paused
    });
    liveInstances.add(created);
    return created;
  }

  beforeEach(() => {
    frames.length = 0;
    drawArrays.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, type) {
      if (type === '2d') {
        const existing = contexts.get(this);
        if (existing) return existing;
        const created = create2dContext();
        contexts.set(this, created);
        return created;
      }
      if (type === 'webgl' || type === 'experimental-webgl') return createGl(drawArrays);
      return null;
    });
    vi.stubGlobal('requestAnimationFrame', (callback: Frame) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('ImageBitmap', class ImageBitmap {});
  });

  afterEach(() => {
    for (const instance of liveInstances) destroyInstance(instance);
    liveInstances.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders one shader pass for homogeneous instances and copies it to each active destination', () => {
    const first = instance();
    const second = instance();

    advance(10_000);

    expect(drawArrays).toHaveBeenCalledTimes(1);
    expect(contexts.get(first.canvas)?.drawImage).toHaveBeenCalledTimes(1);
    expect(contexts.get(second.canvas)?.drawImage).toHaveBeenCalledTimes(1);

    destroyInstance(first);
    destroyInstance(second);
  });

  it('gives an initially paused instance one copy, then idles until it is unpaused', () => {
    const paused = instance(true);
    const context = contexts.get(paused.canvas);

    advance(20_000);
    expect(drawArrays).toHaveBeenCalledTimes(1);
    expect(context?.drawImage).toHaveBeenCalledTimes(1);

    advance(20_100);
    expect(drawArrays).toHaveBeenCalledTimes(1);
    expect(context?.drawImage).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);

    updateInstance(paused, { paused: false });
    advance(20_200);
    expect(drawArrays).toHaveBeenCalledTimes(2);
    expect(context?.drawImage).toHaveBeenCalledTimes(2);

    destroyInstance(paused);
  });

  it('idles offscreen work and resumes it without blocking another active instance', () => {
    const hidden = instance();
    const active = instance();
    const hiddenContext = contexts.get(hidden.canvas);
    const activeContext = contexts.get(active.canvas);

    advance(30_000);
    setInstanceVisible(hidden, false);
    advance(30_100);
    expect(drawArrays).toHaveBeenCalledTimes(2);
    expect(hiddenContext?.drawImage).toHaveBeenCalledTimes(1);
    expect(activeContext?.drawImage).toHaveBeenCalledTimes(2);

    setInstanceVisible(active, false);
    advance(30_200);
    expect(drawArrays).toHaveBeenCalledTimes(2);
    expect(frames).toHaveLength(0);

    setInstanceVisible(hidden, true);
    advance(30_300);
    expect(drawArrays).toHaveBeenCalledTimes(3);
    expect(hiddenContext?.drawImage).toHaveBeenCalledTimes(2);

    destroyInstance(hidden);
    destroyInstance(active);
  });
});
