import { forwardRef, type HTMLAttributes } from 'react';
import { MetalFx, type MetalFxMaterialName, type MetalFxTheme } from '../../../src';
import { useReducedMotion } from '../../material-lab/useReducedMotion';
import './metal-kit.css';

export interface MetalCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Material token driving the frame. @default 'obsidian' */
  material?: MetalFxMaterialName;
  /** Theme mode; 'auto' adapts to the OS scheme. Pin when the surrounding surface is fixed. @default 'auto' */
  theme?: MetalFxTheme;
  /**
   * Let pointer position light the frame. Off by default — cards are
   * containers, and a whole surface that chases the cursor reads as noise;
   * opt in for hero cards that are themselves the call to action.
   */
  interactive?: boolean;
}

/**
 * Content card framed by a metal ring. Non-interactive by default: the
 * material is presentation, so the default token (obsidian, 66%) is the
 * quietest in the registry. Compose MetalCardEyebrow/MetalCardTitle or any
 * children inside.
 */
export const MetalCard = forwardRef<HTMLDivElement, MetalCardProps>(function MetalCard(
  { material = 'obsidian', interactive = false, theme = 'auto', className, children, ...rest },
  ref
) {
  const reducedMotion = useReducedMotion();
  return (
    <MetalFx
      material={material}
      theme={theme}
      interactive={interactive && !reducedMotion}
      paused={reducedMotion}
      disableGlow={reducedMotion}
    >
      <div {...rest} className={['mk-card', className].filter(Boolean).join(' ')} ref={ref}>
        {children}
      </div>
    </MetalFx>
  );
});

export function MetalCardEyebrow({ children }: { children: React.ReactNode }) {
  return <span className="mk-card-eyebrow">{children}</span>;
}

export function MetalCardTitle({ children }: { children: React.ReactNode }) {
  return <strong className="mk-card-title">{children}</strong>;
}
