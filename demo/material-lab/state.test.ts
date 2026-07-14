import { describe, expect, it } from 'vitest';
import { buildMaterialLabSearch, isMaterialLabRequested, readMaterialLabState } from './state';

describe('Material Lab query state', () => {
  it('uses the complete foundation state when only the lab route is requested', () => {
    expect(readMaterialLabState('?material-lab=1')).toEqual({
      fixture: 'foundation',
      preview: 'pill',
      preset: 'chromatic',
      theme: 'dark',
      strength: 90,
      paused: false
    });
    expect(readMaterialLabState('?material-lab=1&strength=').strength).toBe(90);
  });

  it('normalizes malformed state to a safe foundation fixture', () => {
    expect(
      readMaterialLabState('?material-lab=1&preview=wall&preset=plasma&theme=void&strength=490&paused=yes')
    ).toEqual({
      fixture: 'foundation',
      preview: 'pill',
      preset: 'chromatic',
      theme: 'dark',
      strength: 100,
      paused: false
    });
  });

  it('serializes every selectable field while retaining unrelated query values', () => {
    const search = buildMaterialLabSearch(
      { fixture: 'foundation', preview: 'circle', preset: 'gold', theme: 'light', strength: 62, paused: true },
      '?source=review'
    );
    expect(search).toBe(
      '?source=review&material-lab=1&fixture=foundation&preview=circle&preset=gold&theme=light&strength=62&paused=1'
    );
    expect(isMaterialLabRequested(search)).toBe(true);
  });
});
