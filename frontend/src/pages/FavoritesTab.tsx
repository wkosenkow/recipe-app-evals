import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import Footer from "../components/Footer";
import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";

function FavoritesTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, loading, error, toggleFavorite } = useFavorites();

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {!user && (
          <div className="py-10 text-center text-sm text-gray-500">
            Log in to see your favorites.{" "}
            <button type="button" onClick={() => navigate("/login")} className="font-semibold text-blue-400 hover:underline">
              Log in
            </button>
          </div>
        )}

        {user && loading && <div className="text-sm text-gray-500">Loading…</div>}
        {user && error && <div className="text-sm text-red-500">{error}</div>}

        {user && !loading && !error && favorites.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No favorites yet — tap the star on a recipe to save it here.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {user && favorites.map((favorite) => (
            <RecipeCard
              key={favorite.mealId}
              title={favorite.title}
              thumbnail={favorite.thumbnail}
              cuisine={favorite.cuisine}
              isFavorite
              onToggleFavorite={() => toggleFavorite(favorite.mealId)}
              onOpen={() => navigate(`/recipes/${favorite.mealId}`)}
            />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default FavoritesTab;
