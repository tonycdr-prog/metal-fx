/** One grouped shader pass and its material uniform uploads. */
import { hexToRgb } from '../color';
import type { FinishProfile } from '../finishes';
import type { PresetMode } from '../presets';
import { SHARED } from './core';

function uploadMaterialUniforms(): void {
  if (!SHARED) return;
  const { finish, gl, glCanvas, preset, uniforms } = SHARED;
  if (uniforms.u_resolution) gl.uniform2f(uniforms.u_resolution, glCanvas.width, glCanvas.height);
  for (let index = 0; index < 7; index++) {
    const colorLocation = uniforms[`u_color${index + 1}`];
    if (colorLocation) {
      const [red, green, blue] = hexToRgb(preset.colors[index]);
      gl.uniform3f(colorLocation, red, green, blue);
    }
    const alphaLocation = uniforms[`u_alpha${index + 1}`];
    if (alphaLocation) gl.uniform1f(alphaLocation, preset.alphas[index]);
  }
  if (uniforms.u_intensity) gl.uniform1f(uniforms.u_intensity, preset.intensity);
  if (uniforms.u_scale) gl.uniform1f(uniforms.u_scale, preset.scale);
  if (uniforms.u_direction) gl.uniform1f(uniforms.u_direction, (preset.direction * Math.PI) / 180);
  if (uniforms.u_softness) gl.uniform1f(uniforms.u_softness, preset.softness);
  if (uniforms.u_distortion) gl.uniform1f(uniforms.u_distortion, preset.distortion);
  if (uniforms.u_complexity) gl.uniform1f(uniforms.u_complexity, preset.complexity);
  if (uniforms.u_shape) gl.uniform1f(uniforms.u_shape, preset.shape);
  if (uniforms.u_vignette) gl.uniform1f(uniforms.u_vignette, preset.vignette);
  if (uniforms.u_vigOpacity) gl.uniform1f(uniforms.u_vigOpacity, preset.vigOpacity);
  if (uniforms.u_blur) gl.uniform1f(uniforms.u_blur, preset.blur);
  if (uniforms.u_shaderOpacity) gl.uniform1f(uniforms.u_shaderOpacity, preset.shaderOpacity);
  if (uniforms.u_finishGrain) gl.uniform1f(uniforms.u_finishGrain, finish.grain);
  if (uniforms.u_finishGrainScale) gl.uniform1f(uniforms.u_finishGrainScale, finish.grainScale);
  if (uniforms.u_finishFlow) gl.uniform1f(uniforms.u_finishFlow, finish.flow);
  if (uniforms.u_finishSpectral) gl.uniform1f(uniforms.u_finishSpectral, finish.spectral);
  if (uniforms.u_finishContrast) gl.uniform1f(uniforms.u_finishContrast, finish.contrast);
  SHARED.presetDirty = false;
}

export function renderSharedFrame(now: number, preset: PresetMode, finish: FinishProfile): void {
  if (!SHARED) return;
  const { gl, glCanvas, uniforms } = SHARED;
  SHARED.preset = preset;
  SHARED.finish = finish;
  SHARED.presetDirty = true;
  const time = ((now - SHARED.startMs - SHARED.pausedMs) / 1000) * preset.speed * finish.speed;

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  uploadMaterialUniforms();
  if (uniforms.u_time) gl.uniform1f(uniforms.u_time, time);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  SHARED.frameCount++;
}
