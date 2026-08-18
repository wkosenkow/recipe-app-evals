import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { filterMealsByArea, listAreas, searchMealsByName } from "../lib/mealdb";
import Footer from "../components/Footer";
import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";
import { toIngredientList, toTagList, type MealDBMeal, type MealDBSummary } from "../types/mealdb";

// Search returns whole meals; the cuisine filter returns summaries carrying
// only id/name/thumbnail. Modelling the extras as optional says exactly that,
// and lets each card show whatever its own source happened to provide rather
// than pretending the two endpoints are interchangeable.
type RecipeListItem = MealDBSummary & Partial<MealDBMeal>;

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
  const [meals, setMeals] = useState<RecipeListItem[]>([]);
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
        />

        {cuisine === "All" ? (
          <div className="flex flex-col gap-3">
            <input
              className="input"
              value={cuisineQuery}
              onChange={(e) => setCuisineQuery(e.target.value)}
              placeholder="Filter cuisines…"
            />
            {matchingAreas.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {matchingAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className="tag tag-outline"
                    onClick={() => {
                      setCuisine(area);
                      setCuisineQuery("");
                    }}
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {/* Selected, not merely offered — so it's the filled tag rather
                than the outline the suggestions above use. */}
            <button
              type="button"
              onClick={() => setCuisine("All")}
              className="tag tag-accent cursor-pointer gap-1 hover:bg-accent-700"
            >
              {cuisine}
              <span aria-hidden="true">✕</span>
              <span className="sr-only">— clear this cuisine</span>
            </button>
          </div>
        )}

        {loading && <div className="text-sm text-neutral-500">Loading…</div>}
        {error && <div className="text-sm text-danger">{error}</div>}

        {!loading && !error && showPrompt && (
          <div className="py-10 text-center text-sm text-neutral-500">
            Pick a cuisine or search for a recipe by name.
          </div>
        )}

        {!loading && !error && !showPrompt && meals.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-500">
            {narrowedToNothing ? (
              <>
                <span>
                  {cuisineTotal} {cuisine} recipes, but none with “{trimmedQuery}” in the name.
                </span>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="font-semibold text-accent-300 hover:text-accent-200"
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
                  className="font-semibold text-accent-300 hover:text-accent-200"
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
              // Both endpoints carry strArea today; the selected cuisine is
              // only a fallback for a row that somehow arrives without one.
              cuisine={meal.strArea ?? (cuisine !== "All" ? cuisine : undefined)}
              category={meal.strCategory}
              tags={toTagList(meal)}
              ingredientCount={toIngredientList(meal).length}
              hasVideo={Boolean(meal.strYoutube)}
              isFavorite={isFavorite(meal.idMeal)}
              onToggleFavorite={() => handleToggleFavorite(meal.idMeal)}
              to={`/recipes/${meal.idMeal}`}
            />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RecipesTab;
