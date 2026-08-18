import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { lookupMealById } from "../lib/mealdb";
import ChatView from "../components/ChatView";
import Footer from "../components/Footer";
import { toIngredientList, toTagList, type MealDBMeal } from "../types/mealdb";

type ViewMode = "card" | "recipe" | "cooking";

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useKitchenProfile();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [meal, setMeal] = useState<MealDBMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("card");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    lookupMealById(id)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError("Recipe not found");
          return;
        }
        setMeal(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load recipe");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  }

  if (error || !meal) {
    return <div className="p-4 text-sm text-red-500">{error ?? "Recipe not found"}</div>;
  }

  if (view === "recipe") {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950 p-4">
        <button type="button" onClick={() => setView("card")} className="mb-4 self-start text-sm text-gray-400">
          ← Back to recipe
        </button>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="text-lg font-semibold text-gray-100">{meal.strMeal}</div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ingredients</div>
            <ul className="flex flex-col gap-1 text-sm text-gray-300">
              {toIngredientList(meal).map((ingredient, index) => (
                <li key={index}>
                  {ingredient.measure} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Instructions</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{meal.strInstructions}</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "cooking") {
    return (
      <div className="flex h-screen flex-col bg-gray-950 p-4">
        <button type="button" onClick={() => setView("card")} className="mb-4 self-start text-sm text-gray-400">
          ← Back to recipe
        </button>
        <ChatView
          recipe={{
            title: meal.strMeal,
            cuisine: meal.strArea,
            ingredients: toIngredientList(meal),
            instructions: meal.strInstructions,
          }}
          kitchenProfile={profile}
        />
      </div>
    );
  }

  const favorite = isFavorite(meal.idMeal);
  const tags = toTagList(meal);

  const handleToggleFavorite = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFavorite(meal.idMeal, meal);
  };

  const handleCookWithAi = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setView("cooking");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <button type="button" onClick={() => navigate(-1)} className="self-start text-sm text-gray-400">
          ← Back
        </button>

        <img src={meal.strMealThumb} alt="" className="h-48 w-full rounded-md bg-gray-800 object-cover" />

        <div className="flex items-start justify-between gap-3">
          <div className="text-xl font-semibold text-gray-100">{meal.strMeal}</div>
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`text-2xl leading-none ${favorite ? "text-yellow-400" : "text-gray-600"}`}
          >
            {favorite ? "★" : "☆"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
            {meal.strArea}
          </span>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
            {meal.strCategory}
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {(meal.strYoutube || meal.strSource) && (
          <div className="flex flex-wrap gap-4 text-xs">
            {meal.strYoutube && (
              <a
                href={meal.strYoutube}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-400 hover:underline"
              >
                ▶ Watch video
              </a>
            )}
            {meal.strSource && (
              <a
                href={meal.strSource}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-400 hover:underline"
              >
                ↗ View original recipe
              </a>
            )}
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setView("recipe")}
            className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-gray-200"
          >
            Recipe
          </button>
          <button
            type="button"
            onClick={handleCookWithAi}
            className="flex-1 rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Cook with AI
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RecipeDetail;
