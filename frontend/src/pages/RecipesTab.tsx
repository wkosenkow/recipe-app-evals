import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { filterMealsByArea, listAreas, searchMealsByName } from "../lib/mealdb";
import Footer from "../components/Footer";
import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";
import type { MealDBSummary } from "../types/mealdb";

function RecipesTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (mealId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFavorite(mealId);
  };

  const [areas, setAreas] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState("All");
  const [cuisineQuery, setCuisineQuery] = useState("");
  const [query, setQuery] = useState("");
  const [meals, setMeals] = useState<MealDBSummary[]>([]);
  // How many the cuisine returned before the name filter narrowed it. Without
  // this an empty result cannot tell the difference between "this cuisine has
  // nothing" and "the search box threw everything away".
  const [cuisineTotal, setCuisineTotal] = useState(0);
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
          setCuisineTotal(cuisine !== "All" ? results.length : 0);
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

  const trimmedQuery = query.trim();
  const showPrompt = cuisine === "All" && trimmedQuery === "";

  // The search box matches meal names, so a cuisine typed into it finds
  // nothing — "Indian" is a cuisine, not a dish. Offer the cuisine instead of
  // letting the dead end stand.
  const suggestedArea =
    cuisine === "All" && trimmedQuery !== ""
      ? areas.find((area) => area.toLowerCase() === trimmedQuery.toLowerCase())
      : undefined;

  // The cuisine returned recipes and the name filter removed every one of
  // them. Saying "no recipes match" here hides the cause: the cook picked a
  // cuisine and still sees nothing, because of text left in the other box.
  const narrowedToNothing = cuisine !== "All" && trimmedQuery !== "" && cuisineTotal > 0;

  const matchingAreas =
    cuisine === "All" && cuisineQuery.trim() !== ""
      ? areas.filter((area) => area.toLowerCase().includes(cuisineQuery.trim().toLowerCase()))
      : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
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
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
            {narrowedToNothing ? (
              <>
                <span>
                  {cuisineTotal} {cuisine} recipes, but none with “{trimmedQuery}” in the name.
                </span>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="font-semibold text-blue-400 hover:underline"
                >
                  Clear the search
                </button>
              </>
            ) : suggestedArea ? (
              <>
                <span>No recipe is named “{trimmedQuery}”.</span>
                <button
                  type="button"
                  onClick={() => {
                    setCuisine(suggestedArea);
                    setQuery("");
                  }}
                  className="font-semibold text-blue-400 hover:underline"
                >
                  Browse {suggestedArea} recipes instead
                </button>
              </>
            ) : (
              <span>No recipes match your search.</span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <RecipeCard
              key={meal.idMeal}
              title={meal.strMeal}
              thumbnail={meal.strMealThumb}
              isFavorite={isFavorite(meal.idMeal)}
              onToggleFavorite={() => handleToggleFavorite(meal.idMeal)}
              onOpen={() => navigate(`/recipes/${meal.idMeal}`)}
            />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RecipesTab;
