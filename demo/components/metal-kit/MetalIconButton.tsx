import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { MATERIALS, MetalFx, type MetalFxMaterialName, type MetalFxTheme } from '../../../src';
import { useReducedMotion } from '../../material-lab/useReducedMotion';
import './metal-kit.css';
import { usePressLighting } from './usePressLighting';

export type MetalIconButtonSize = 'sm' | 'md' | 'lg';

export interface MetalIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon-only controls must name themselves for assistive tech. */
  'aria-label': string;
  /** Material token driving the ring. @default 'mercury' */
  material?: MetalFxMaterialName;
  /** Theme mode; 'auto' adapts to the OS scheme. Pin when the surrounding surface is fixed. @default 'auto' */
  theme?: MetalFxTheme;
  /** Diameter: sm 32px, md 40px, lg 48px. @default 'md' */
  size?: MetalIconButtonSize;
}

/**
 * Circular icon button framed by a live metal ring (the "send button"
 * pattern from the showcase). aria-label is required at the type level so
 * an icon-only control can never ship unnamed.
 */
export const MetalIconButton = forwardRef<HTMLButtonElement, MetalIconButtonProps>(function MetalIconButton(
  { material = 'mercury', size = 'md', theme = 'auto', className, disabled, children, ...rest },
  ref
) {
  const reducedMotion = useReducedMotion();
  const { emphasis, handlers } = usePressLighting(Boolean(disabled));
  const baseStrength = MATERIALS[material].strength;

  return (
    <MetalFx
      material={material}
      theme={theme}
      strength={baseStrength * emphasis}
      variant="circle"
      interactive={!disabled && !reducedMotion}
      paused={reducedMotion}
      disableGlow={Boolean(disabled) || reducedMotion}
    >
      <button
        {...rest}
        {...(disabled ? {} : handlers)}
        className={['mk-icon-button', `mk-size-${size}`, className].filter(Boolean).join(' ')}
        disabled={disabled}
        ref={ref}
        type={rest.type ?? 'button'}
      >
        {children}
      </button>
    </MetalFx>
  );
});
