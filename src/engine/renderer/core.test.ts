import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MetalFxInstance } from './core';
import { ensureSharedRenderer, SHARED, setContextRestoredCallback, teardownSharedRenderer } from './core';

function createFakeGl() {
  const loseContext = vi.fn();
  return {
    ARRAY_BUFFER: 0x8892,
    BLEND: 0x0be2,
    COMPILE_STATUS: 0x8b81,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: 0x8b82,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    SRC_ALPHA: 0x0302,
    STATIC_DRAW: 0x88e4,
    VERTEX_SHADER: 0x8b31,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    blendFunc: vi.fn(),
    bufferData: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: vi.fn((): WebGLBuffer | null => ({}) as WebGLBuffer),
    createProgram: vi.fn((): WebGLProgram | null => ({}) as WebGLProgram),
    createShader: vi.fn((): WebGLShader | null => ({}) as WebGLShader),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    enable: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getExtension: vi.fn(() => ({ loseContext })),
    getProgramInfoLog: vi.fn(() => null),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => null),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn(() => ({}) as WebGLUniformLocation),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    loseContext
  };
}

function installWebGl() {
  const gl = createFakeGl();
  vi.stubGlobal('OffscreenCanvas', undefined);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId) => {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
      return gl as unknown as WebGLRenderingContext;
    }
    return null;
  });
  return gl;
}

describe('shared WebGL context lifecycle', () => {
  afterEach(() => {
    setContextRestoredCallback(null);
    teardownSharedRenderer();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stops lost work and atomically publishes a rebuilt pipeline before resuming', () => {
    const gl = installWebGl();
    const cancelFrame = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const removeListener = vi.spyOn(HTMLCanvasElement.prototype, 'removeEventListener');
    const restored = vi.fn();
    setContextRestoredCallback(restored);

    const shared = ensureSharedRenderer();
    const initialProgram = shared.program;
    const initialBuffer = shared.buffer;
    shared.rafId = 17;
    const canvas = shared.glCanvas as HTMLCanvasElement;

    const lost = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(cancelFrame).toHaveBeenCalledWith(17);
    expect(shared).toMatchObject({ contextLost: true, rafId: 0 });

    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(shared.contextLost).toBe(false);
    expect(shared.program).not.toBe(initialProgram);
    expect(shared.buffer).not.toBe(initialBuffer);
    expect(restored).toHaveBeenCalledOnce();
    expect(gl.createProgram).toHaveBeenCalledTimes(2);
    expect(gl.createBuffer).toHaveBeenCalledTimes(2);

    teardownSharedRenderer();
    teardownSharedRenderer();
    expect(removeListener.mock.calls.filter(([type]) => type.startsWith('webglcontext')).map(([type]) => type)).toEqual(
      ['webglcontextlost', 'webglcontextrestored']
    );
  });

  it('falls every instance back and releases both listeners when rebuilding fails', () => {
    const gl = installWebGl();
    const removeListener = vi.spyOn(HTMLCanvasElement.prototype, 'removeEventListener');
    const shared = ensureSharedRenderer();
    const canvas = shared.glCanvas as HTMLCanvasElement;
    const firstFailure = vi.fn();
    const secondFailure = vi.fn();
    shared.instances.add({ onContextFailure: firstFailure } as unknown as MetalFxInstance);
    shared.instances.add({ onContextFailure: secondFailure } as unknown as MetalFxInstance);

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    gl.createBuffer.mockReturnValueOnce(null);
    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(firstFailure).toHaveBeenCalledOnce();
    expect(secondFailure).toHaveBeenCalledOnce();
    expect(SHARED).toBeNull();
    expect(removeListener.mock.calls.filter(([type]) => type.startsWith('webglcontext')).map(([type]) => type)).toEqual(
      ['webglcontextlost', 'webglcontextrestored']
    );
  });
});
