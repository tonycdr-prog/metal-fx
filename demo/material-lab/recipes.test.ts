import { describe, expect, it } from 'vitest';
import { isMetalFxMaterialName, MATERIALS } from '../../src';
import { MATERIAL_RECIPES } from './recipes';

describe('Material Lab recipes', () => {
  it('derives every registry-backed recipe from MATERIALS (no drift)', () => {
    for (const recipe of MATERIAL_RECIPES) {
      if (!isMetalFxMaterialName(recipe.id)) continue;
      const material = MATERIALS[recipe.id];
      expect(recipe.state.preset, recipe.id).toBe(material.preset);
      expect(recipe.state.finish, recipe.id).toBe(material.finish);
      expect(recipe.state.strength, recipe.id).toBe(Math.round(material.strength * 100));
    }
  });

  it('keeps electric-plasma as a Lab-only staging of molten-chrome (RFC 0001 resolution 3)', () => {
    const plasma = MATERIAL_RECIPES.find((recipe) => recipe.id === 'electric-plasma');
    expect(isMetalFxMaterialName('electric-plasma')).toBe(false);
    expect(plasma?.state.preset).toBe(MATERIALS['molten-chrome'].preset);
    expect(plasma?.state.finish).toBe(MATERIALS['molten-chrome'].finish);
    expect(plasma?.state.environment).not.toBe('studio-sweep');
  });
});
