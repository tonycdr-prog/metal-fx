import { useState } from 'react';

export interface PressLighting {
  /** 0..1 multiplier applied to the material's base strength. */
  emphasis: number;
  handlers: {
    onBlur: () => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onKeyUp: (event: React.KeyboardEvent) => void;
    onPointerCancel: () => void;
    onPointerDown: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    onPointerUp: () => void;
  };
}

/**
 * Visual hover/press emphasis for metal-kit controls. Activation semantics
 * stay native (the browser already cancels a click when the pointer is
 * released outside the control); this hook only drives how brightly the
 * material reads in each state. Idle sits below the token's strength so
 * hover and press have visible headroom.
 */
export function usePressLighting(disabled: boolean): PressLighting {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const emphasis = disabled ? 0.3 : pressed ? 1 : hovered ? 0.85 : 0.62;

  return {
    emphasis,
    handlers: {
      onBlur: () => setPressed(false),
      onKeyDown: (event) => {
        if (event.key === ' ' || event.key === 'Enter') setPressed(true);
      },
      onKeyUp: (event) => {
        if (event.key === ' ' || event.key === 'Enter') setPressed(false);
      },
      onPointerCancel: () => setPressed(false),
      onPointerDown: () => setPressed(true),
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => {
        setHovered(false);
        setPressed(false);
      },
      onPointerUp: () => setPressed(false)
    }
  };
}
