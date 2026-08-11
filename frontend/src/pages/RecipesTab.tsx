import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFavorites } from "../context/FavoritesContext";
import { filterMealsByArea, listAreas, searchMealsByName } from "../lib/mealdb";
import { RECIPE_ENRICHMENT } from "../lib/recipe-enrichment";
import RecipeCard from "../components/RecipeCard";
import TabBar from "../components/TabBar";
import type { MealDBSummary } from "../types/mealdb";

function RecipesTab() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [areas, setAreas] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState("All");
  const [cuisineQuery, setCuisineQuery] = useState("");
  const [query, setQuery] = useState("");
  const [meals, setMeals] = useState<MealDBSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAreas().catch(() => []).then((result) => setAreas(result ?? []));
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (cuisine === "All" && query.trim() === "") {
      setMeals([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(true);
      setError(null);

      const fetchMeals = cuisine !== "All" ? filterMealsByArea(cuisine) : searchMealsByName(query.trim());

      fetchMeals
        .then((results) => {
          if (cancelled) return;
          const q = query.trim().toLowerCase();
          const filtered =
            cuisine !== "All" && q !== "" ? results.filter((meal) => meal.strMeal.toLowerCase().includes(q)) : results;
          setMeals(filtered);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load recipes");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [cuisine, query]);

  const showPrompt = cuisine === "All" && query.trim() === "";

  const matchingAreas =
    cuisine === "All" && cuisineQuery.trim() !== ""
      ? areas.filter((area) => area.toLowerCase().includes(cuisineQuery.trim().toLowerCase()))
      : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="text-xl font-semibold text-gray-100">Recipes</div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
          className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
        />

        {cuisine === "All" ? (
          <div className="flex flex-col gap-2">
            <input
              value={cuisineQuery}
              onChange={(e) => setCuisineQuery(e.target.value)}
              placeholder="Filter cuisines…"
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
            />
            {matchingAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {matchingAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setCuisine(area);
                      setCuisineQuery("");
                    }}
                    className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400"
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCuisine("All")}
              className="flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400"
            >
              {cuisine}
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}

        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && !error && showPrompt && (
          <div className="py-10 text-center text-sm text-gray-500">Pick a cuisine or search for a recipe by name.</div>
        )}

        {!loading && !error && !showPrompt && meals.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">No recipes match your search.</div>
        )}

        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <RecipeCard
              key={meal.idMeal}
              title={meal.strMeal}
              thumbnail={meal.strMealThumb}
              equipment={RECIPE_ENRICHMENT[meal.idMeal]?.equipment}
              isFavorite={isFavorite(meal.idMeal)}
              onToggleFavorite={() => toggleFavorite(meal.idMeal)}
              onOpen={() => navigate(`/recipes/${meal.idMeal}`)}
            />
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  );
}

export default RecipesTab;
