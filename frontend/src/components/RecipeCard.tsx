import type { Recipe } from "../types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  missingEquipment: string[];
  onOpen: () => void;
}

function RecipeCard({ recipe, missingEquipment, onOpen }: RecipeCardProps) {
  const isReady = missingEquipment.length === 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-3 rounded-md border border-gray-700 bg-gray-900 p-3 text-left"
    >
      <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-800" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-sm font-semibold text-gray-100">{recipe.title}</div>
        <div className="font-mono text-xs text-gray-500">
          {recipe.cuisine} · {recipe.time} min · {recipe.difficulty}
        </div>
        <span className={`text-xs font-semibold ${isReady ? "text-green-500" : "text-red-500"}`}>
          {isReady ? "Ready with your kitchen" : `Missing ${missingEquipment.join(", ")}`}
        </span>
      </div>
    </button>
  );
}

export default RecipeCard;
