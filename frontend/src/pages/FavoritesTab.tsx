import { useNavigate } from "react-router-dom";

import { useFavorites } from "../context/FavoritesContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { missingEquipment } from "../lib/recipe-logic";
import { useRecipes } from "../lib/use-recipes";
import RecipeCard from "../components/RecipeCard";
import TabBar from "../components/TabBar";

function FavoritesTab() {
  const navigate = useNavigate();
  const { recipes, loading, error } = useRecipes();
  const { profile } = useKitchenProfile();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const favoritedRecipes = recipes.filter((recipe) => favorites.includes(recipe._id));

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="text-xl font-semibold text-gray-100">Favorites</div>

        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && !error && favoritedRecipes.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No favorites yet — tap the star on a recipe to save it here.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {favoritedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe._id}
              recipe={recipe}
              missingEquipment={missingEquipment(recipe, profile.equipment)}
              isFavorite={isFavorite(recipe._id)}
              onToggleFavorite={() => toggleFavorite(recipe._id)}
              onOpen={() => navigate(`/recipes/${recipe._id}`)}
            />
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  );
}

export default FavoritesTab;
