import { type MutableRefObject, type RefObject, useEffect } from 'react';
import type { MetalFxInstance } from '../engine/renderer/core';
import { updateInstance } from '../engine/renderer/loop';

const POINTER_STEPS = 12;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function quantize(value: number): number {
  return Math.round(clamp(value) * POINTER_STEPS) / POINTER_STEPS;
}

interface UseMaterialInteractionOptions {
  enabled: boolean;
  instanceRef: MutableRefObject<MetalFxInstance | null>;
  rootRef: RefObject<HTMLDivElement>;
}

/** Owns opt-in pointer and keyboard lighting without routing high-frequency state through React. */
export function useMaterialInteraction({ enabled, instanceRef, rootRef }: UseMaterialInteractionOptions): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;

    let pointerInside = false;
    let pointerPressed = false;
    let keyboardPressed = false;

    const update = (patch: Partial<Pick<MetalFxInstance, 'lightX' | 'lightY' | 'lightIntensity' | 'press'>>) => {
      const instance = instanceRef.current;
      if (instance) updateInstance(instance, patch);
    };

    const updatePointerPosition = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerInside = true;
      update({
        lightX: quantize((event.clientX - rect.left) / rect.width),
        lightY: quantize(1 - (event.clientY - rect.top) / rect.height),
        lightIntensity: 1
      });
    };

    const onPointerEnter = (event: PointerEvent) => updatePointerPosition(event);
    const onPointerMove = (event: PointerEvent) => updatePointerPosition(event);
    const onPointerLeave = () => {
      pointerInside = false;
      if (!pointerPressed && !keyboardPressed) update({ lightIntensity: 0 });
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerPressed = true;
      updatePointerPosition(event);
      update({ press: 1 });
    };
    const onPointerUp = () => {
      if (!pointerPressed) return;
      pointerPressed = false;
      update({
        press: keyboardPressed ? 1 : 0,
        lightIntensity: keyboardPressed || pointerInside ? 1 : root.contains(document.activeElement) ? 0.55 : 0
      });
    };
    const onPointerCancel = () => {
      pointerInside = false;
      onPointerUp();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || keyboardPressed || (event.key !== 'Enter' && event.key !== ' ')) return;
      keyboardPressed = true;
      update({ lightX: 0.5, lightY: 0.5, lightIntensity: 1, press: 1 });
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!keyboardPressed || (event.key !== 'Enter' && event.key !== ' ')) return;
      keyboardPressed = false;
      update({
        press: pointerPressed ? 1 : 0,
        lightIntensity: pointerPressed || pointerInside ? 1 : root.contains(document.activeElement) ? 0.55 : 0
      });
    };
    const onFocusIn = () => update({ lightX: 0.5, lightY: 0.5, lightIntensity: 0.55 });
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
      if (!pointerPressed && !keyboardPressed && !pointerInside) update({ lightIntensity: 0 });
    };
    const onWindowBlur = () => {
      pointerInside = false;
      pointerPressed = false;
      keyboardPressed = false;
      update({ lightX: 0.5, lightY: 0.5, lightIntensity: 0, press: 0 });
    };

    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      update({ lightX: 0.5, lightY: 0.5, lightIntensity: 0, press: 0 });
    };
  }, [enabled, instanceRef, rootRef]);
}
