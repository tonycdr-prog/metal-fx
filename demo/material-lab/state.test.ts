import { describe, expect, it } from 'vitest';
import { buildMaterialLabSearch, isMaterialLabRequested, readMaterialLabState } from './state';

describe('Material Lab query state', () => {
  it('uses the complete foundation state when only the lab route is requested', () => {
    expect(readMaterialLabState('?material-lab=1')).toEqual({
      environment: 'studio-sweep',
      finish: 'molten',
      fixture: 'foundation',
      interactive: false,
      preview: 'pill',
      recipe: 'molten-chrome',
      preset: 'chromatic',
      theme: 'dark',
      strength: 100,
      paused: false
    });
    expect(readMaterialLabState('?material-lab=1&strength=').strength).toBe(100);
  });

  it('uses the selected recipe strength when a strength override is invalid', () => {
    expect(readMaterialLabState('?material-lab=1&recipe=copper&strength=not-a-number').strength).toBe(88);
  });

  it('uses the selected recipe environment when an override is missing or invalid', () => {
    expect(readMaterialLabState('?material-lab=1&recipe=holographic').environment).toBe('spectral-wash');
    expect(readMaterialLabState('?material-lab=1&recipe=holographic&environment=unknown').environment).toBe(
      'spectral-wash'
    );
  });

  it('normalizes malformed state to a safe foundation fixture', () => {
    expect(
      readMaterialLabState(
        '?material-lab=1&preview=wall&preset=plasma&finish=painted&theme=void&strength=490&paused=yes'
      )
    ).toEqual({
      fixture: 'foundation',
      interactive: false,
      environment: 'studio-sweep',
      finish: 'molten',
      preview: 'pill',
      recipe: 'molten-chrome',
      preset: 'chromatic',
      theme: 'dark',
      strength: 100,
      paused: false
    });
  });

  it('drops removed interaction state while retaining unrelated query values', () => {
    const search = buildMaterialLabSearch(
      {
        fixture: 'foundation',
        environment: 'spectral-wash',
        finish: 'brushed',
        interactive: true,
        recipe: 'copper',
        preview: 'circle',
        preset: 'gold',
        theme: 'light',
        strength: 62,
        paused: true
      },
      '?source=review&interaction=press-hold'
    );
    expect(search).toBe(
      '?source=review&material-lab=1&fixture=foundation&recipe=copper&environment=spectral-wash&finish=brushed&interactive=1&preview=circle&preset=gold&theme=light&strength=62&paused=1'
    );
    expect(readMaterialLabState('?material-lab=1&interaction=press-hold')).toEqual(
      readMaterialLabState('?material-lab=1')
    );
    expect(isMaterialLabRequested(search)).toBe(true);
  });
});
