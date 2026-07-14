import { useEffect, useState } from 'react';

export type InteractionMode =
  | 'off'
  | 'pointer-position'
  | 'pointer-velocity'
  | 'press-hold'
  | 'scroll-response'
  | 'proximity-response'
  | 'idle-breathing';

export function clampInteractionSignal(value: number): number {
  return Math.min(1, Math.max(-1, value));
}

export function useInteractionSignal(mode: InteractionMode, reducedMotion: boolean, host: HTMLElement | null): number {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    if (!host || reducedMotion || mode === 'off' || mode === 'idle-breathing') {
      setSignal(0);
      return;
    }
    setSignal(0);

    let frame = 0;
    let pendingSignal = 0;
    let previousX: number | null = null;
    const schedule = (value: number) => {
      pendingSignal = value;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setSignal(clampInteractionSignal(pendingSignal));
      });
    };
    const reset = () => schedule(0);
    const resetImmediately = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pendingSignal = 0;
      setSignal(0);
    };
    const pointerValue = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      return ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    };
    const onPointerMove = (event: PointerEvent) => {
      const value = pointerValue(event);
      schedule(mode === 'pointer-velocity' ? value - (previousX ?? value) : value);
      previousX = value;
    };
    const onProximity = (event: PointerEvent) => schedule(1 - Math.abs(pointerValue(event)));
    const activatePress = () => schedule(1);
    const onPress = (event: PointerEvent) => {
      host.setPointerCapture(event.pointerId);
      activatePress();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') activatePress();
    };
    const onScroll = () => schedule(Math.sin(window.scrollY / 120));
    const onVisibilityChange = () => {
      if (document.hidden) resetImmediately();
    };

    if (mode === 'scroll-response') window.addEventListener('scroll', onScroll, { passive: true });
    else if (mode === 'pointer-position' || mode === 'pointer-velocity') {
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', reset);
    } else if (mode === 'proximity-response') {
      host.addEventListener('pointermove', onProximity);
      host.addEventListener('pointerleave', reset);
    } else if (mode === 'press-hold') {
      host.addEventListener('pointerdown', onPress);
      host.addEventListener('pointerup', reset);
      host.addEventListener('pointercancel', reset);
      host.addEventListener('lostpointercapture', reset);
      host.addEventListener('keydown', onKeyDown);
      host.addEventListener('keyup', reset);
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (mode === 'scroll-response') window.removeEventListener('scroll', onScroll);
      else if (mode === 'pointer-position' || mode === 'pointer-velocity') {
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', reset);
      } else if (mode === 'proximity-response') {
        host.removeEventListener('pointermove', onProximity);
        host.removeEventListener('pointerleave', reset);
      } else if (mode === 'press-hold') {
        host.removeEventListener('pointerdown', onPress);
        host.removeEventListener('pointerup', reset);
        host.removeEventListener('pointercancel', reset);
        host.removeEventListener('lostpointercapture', reset);
        host.removeEventListener('keydown', onKeyDown);
        host.removeEventListener('keyup', reset);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [host, mode, reducedMotion]);

  return signal;
}
