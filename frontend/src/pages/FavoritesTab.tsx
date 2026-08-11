import { useNavigate } from "react-router-dom";

import { useFavorites } from "../context/FavoritesContext";
import RecipeCard from "../components/RecipeCard";
import TabBar from "../components/TabBar";

function FavoritesTab() {
  const navigate = useNavigate();
  const { favorites, loading, error, toggleFavorite } = useFavorites();

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="text-xl font-semibold text-gray-100">Favorites</div>

        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && !error && favorites.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No favorites yet — tap the star on a recipe to save it here.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {favorites.map((favorite) => (
            <RecipeCard
              key={favorite.mealId}
              title={favorite.title}
              thumbnail={favorite.thumbnail}
              cuisine={favorite.cuisine}
              equipment={favorite.enrichment?.equipment}
              isFavorite
              onToggleFavorite={() => toggleFavorite(favorite.mealId)}
              onOpen={() => navigate(`/recipes/${favorite.mealId}`)}
            />
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  );
}

export default FavoritesTab;
