import { afterEach, describe, expect, it, vi } from 'vitest';
import { FINISHES } from '../finishes';
import { PRESETS } from '../presets';
import { ensureSharedRenderer, teardownSharedRenderer } from './core';
import { renderSharedFrame } from './render';

function createGl(uniform1f: ReturnType<typeof vi.fn>) {
  return {
    ARRAY_BUFFER: 0,
    BLEND: 1,
    COLOR_BUFFER_BIT: 2,
    COMPILE_STATUS: 3,
    FLOAT: 4,
    FRAGMENT_SHADER: 5,
    LINK_STATUS: 6,
    ONE_MINUS_SRC_ALPHA: 7,
    SRC_ALPHA: 8,
    STATIC_DRAW: 9,
    TRIANGLES: 10,
    VERTEX_SHADER: 11,
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
    drawArrays: vi.fn(),
    enable: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getExtension: vi.fn(() => null),
    getProgramInfoLog: vi.fn(() => null),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => null),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_program: WebGLProgram, name: string) => name as unknown as WebGLUniformLocation),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    uniform1f,
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn()
  };
}

describe('renderSharedFrame', () => {
  afterEach(() => {
    teardownSharedRenderer();
    vi.restoreAllMocks();
  });

  it('uploads finish uniforms and applies finish speed to shader time', () => {
    const uniform1f = vi.fn();
    const gl = createGl(uniform1f);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (_type) => gl as unknown as RenderingContext
    );
    const shared = ensureSharedRenderer();
    shared.startMs = 1_000;
    shared.pausedMs = 0;

    renderSharedFrame(3_000, PRESETS.gold.modes.dark, FINISHES.brushed);

    expect(uniform1f).toHaveBeenCalledWith('u_time', 2 * PRESETS.gold.modes.dark.speed * FINISHES.brushed.speed);
    expect(uniform1f).toHaveBeenCalledWith('u_finishGrain', FINISHES.brushed.grain);
    expect(uniform1f).toHaveBeenCalledWith('u_finishFlow', FINISHES.brushed.flow);
    expect(uniform1f).toHaveBeenCalledWith('u_finishSpectral', FINISHES.brushed.spectral);
    expect(gl.viewport).toHaveBeenCalledTimes(1);
    expect(gl.clear).toHaveBeenCalledTimes(1);
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 6);
  });
});
