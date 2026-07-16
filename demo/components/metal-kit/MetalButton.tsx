import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { MATERIALS, MetalFx, type MetalFxMaterialName, type MetalFxTheme } from '../../../src';
import { useReducedMotion } from '../../material-lab/useReducedMotion';
import './metal-kit.css';
import { usePressLighting } from './usePressLighting';

export type MetalButtonSize = 'sm' | 'md' | 'lg';

export interface MetalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Material token driving the ring. @default 'mercury' */
  material?: MetalFxMaterialName;
  /** Theme mode; 'auto' adapts to the OS scheme. Pin when the surrounding surface is fixed. @default 'auto' */
  theme?: MetalFxTheme;
  /** Control height: sm 32px, md 40px, lg 48px. @default 'md' */
  size?: MetalButtonSize;
}

/**
 * Pill button framed by a live metal ring. Native <button> semantics are
 * untouched — the wrapper only adds material rendering, pointer-responsive
 * lighting, and hover/press emphasis. Honors prefers-reduced-motion by
 * freezing the shader and disabling responsive lighting.
 */
export const MetalButton = forwardRef<HTMLButtonElement, MetalButtonProps>(function MetalButton(
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
      interactive={!disabled && !reducedMotion}
      paused={reducedMotion}
      disableGlow={Boolean(disabled) || reducedMotion}
    >
      <button
        {...rest}
        {...(disabled ? {} : handlers)}
        className={['mk-button', `mk-size-${size}`, className].filter(Boolean).join(' ')}
        disabled={disabled}
        ref={ref}
        type={rest.type ?? 'button'}
      >
        {children}
      </button>
    </MetalFx>
  );
});
