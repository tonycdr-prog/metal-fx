import { MATERIAL_RECIPES } from '../../material-lab/recipes';
import type { MaterialLabRecipeId } from '../../material-lab/types';
import './material-recipe-picker.css';

export function MaterialRecipePicker({
  onSelect,
  selected
}: {
  onSelect: (id: MaterialLabRecipeId) => void;
  selected: MaterialLabRecipeId;
}) {
  return (
    <nav aria-label="Experimental material treatments" className="material-recipe-picker">
      <p>Treatments</p>
      <div>
        {MATERIAL_RECIPES.map((recipe) => (
          <button
            aria-current={recipe.id === selected ? 'true' : undefined}
            key={recipe.id}
            onClick={() => onSelect(recipe.id)}
            type="button"
          >
            {recipe.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
