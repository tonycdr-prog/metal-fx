import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { MetalFx } from '../../../src';
import type { Theme } from '../../hooks/useTheme';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

export function InteractionStates({ theme }: { theme: Theme }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [activationCount, setActivationCount] = useState(0);
  const cancelledPointerRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const strength = pressed ? 1 : hovered ? 0.85 : 0.55;

  const endPointerPress = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setPressed(false);
  };

  return (
    <section className="w-full mb-12" aria-label="Interaction States">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Experimental implementation</p>
          <h2 className="text-base font-normal leading-[34px] text-(--section-title-color)">Interaction States</h2>
        </div>
        <span className="text-xs text-(--text-muted)" data-testid="motion-state">
          {reducedMotion ? 'Reduced motion: on' : 'Reduced motion: off'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-[10px] bg-(--panel-bg) p-5">
        <MetalFx preset="chromatic" strength={strength} theme={theme} paused={reducedMotion}>
          <button
            type="button"
            data-hovered={hovered ? 'true' : undefined}
            data-pressed={pressed ? 'true' : undefined}
            className="h-10 min-w-36 rounded-full border border-(--pill-border) bg-(--pill-bg) px-5 text-sm text-(--pill-fg) transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => {
              if (cancelledPointerRef.current) {
                cancelledPointerRef.current = false;
                return;
              }
              setActivationCount((count) => count + 1);
            }}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                cancelledPointerRef.current = false;
                setPressed(true);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') setPressed(false);
            }}
            onBlur={() => setPressed(false)}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={(event) => {
              setHovered(false);
              if (event.currentTarget.hasPointerCapture(event.pointerId)) cancelledPointerRef.current = true;
              endPointerPress(event);
            }}
            onPointerDown={(event) => {
              cancelledPointerRef.current = false;
              event.currentTarget.setPointerCapture(event.pointerId);
              setPressed(true);
            }}
            onPointerMove={(event) => {
              if (!pressed || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const isOutside =
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom;
              if (isOutside) {
                cancelledPointerRef.current = true;
                setHovered(false);
                endPointerPress(event);
              }
            }}
            onPointerUp={endPointerPress}
            onPointerCancel={(event) => {
              cancelledPointerRef.current = true;
              endPointerPress(event);
            }}
            onLostPointerCapture={() => setPressed(false)}
          >
            Hover, focus, press
          </button>
        </MetalFx>

        <span className="text-xs text-(--text-muted)" aria-live="polite" data-testid="activation-state">
          Activated {activationCount} {activationCount === 1 ? 'time' : 'times'}
        </span>

        <MetalFx preset="silver" strength={reducedMotion ? 0.45 : 0.7} theme={theme} paused={reducedMotion}>
          <button
            type="button"
            className="h-10 min-w-32 rounded-full border border-(--pill-border) bg-(--pill-bg) px-5 text-sm text-(--pill-fg) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          >
            Keyboard focus
          </button>
        </MetalFx>

        <MetalFx disableGlow preset="gold" strength={0.25} theme={theme} paused={reducedMotion}>
          <button
            type="button"
            disabled
            className="h-10 min-w-28 rounded-full border border-(--pill-border) bg-(--pill-bg) px-5 text-sm text-(--pill-fg) disabled:cursor-not-allowed disabled:opacity-45"
          >
            Disabled
          </button>
        </MetalFx>
      </div>
    </section>
  );
}
