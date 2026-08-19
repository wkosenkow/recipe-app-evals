import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { usePendingFavorite } from "../lib/use-pending-favorite";
import { filterMealsByArea, listAreas, searchMealsByName } from "../lib/mealdb";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import RecipeCard from "../components/RecipeCard";
import { RecipeListSkeleton } from "../components/Skeletons";
import { toIngredientList, toTagList, type MealDBMeal, type MealDBSummary } from "../types/mealdb";

// Search returns whole meals; the cuisine filter returns summaries carrying
// only id/name/thumbnail. Modelling the extras as optional says exactly that,
// and lets each card show whatever its own source happened to provide rather
// than pretending the two endpoints are interchangeable.
type RecipeListItem = MealDBSummary & Partial<MealDBMeal>;

// The "no cuisine chosen" state. It is deliberately never written to the URL —
// `/` and `/?cuisine=All` would otherwise be two addresses for one screen.
const ALL_CUISINES = "All";

function RecipesTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  // Completes a save the cook started before signing in.
  usePendingFavorite();

  const handleToggleFavorite = (mealId: string) => {
    if (!user) {
      // On a phone, losing this meant retyping the search to find the recipe
      // again — so the list and the meal both travel to the login screen.
      navigate("/login", { state: { from: `${location.pathname}${location.search}`, pendingFavorite: mealId } });
      return;
    }
    toggleFavorite(mealId);
  };

  const [areas, setAreas] = useState<string[]>([]);

  // The search and the chosen cuisine live in the URL, not in component state.
  // They used to vanish the moment you opened a recipe: coming back gave an
  // empty box and no results, so finding the dish you had just been looking at
  // meant retyping — on a phone, the most expensive thing the app can ask for.
  // As URL state they survive the round trip, a reload, and the back gesture,
  // and a list of results becomes a link worth sending someone.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const cuisine = searchParams.get("cuisine") ?? ALL_CUISINES;

  // `replace`, always: this fires on every keystroke, and pushing would bury
  // the previous screen under one history entry per character typed.
  const setParam = (key: string, value: string, absent: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === absent) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const setQuery = (value: string) => setParam("q", value, "");
  const setCuisine = (value: string) => setParam("cuisine", value, ALL_CUISINES);

  // Which cuisines the picker is showing is a transient aid, not part of what
  // the screen is displaying — so it stays local and out of the URL.
  const [cuisineQuery, setCuisineQuery] = useState("");
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

    if (cuisine === ALL_CUISINES && query.trim() === "") {
      setMeals([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(true);
      setError(null);

      const fetchMeals = cuisine !== ALL_CUISINES ? filterMealsByArea(cuisine) : searchMealsByName(query.trim());

      fetchMeals
        .then((results) => {
          if (cancelled) return;
          const q = query.trim().toLowerCase();
          setCuisineTotal(cuisine !== ALL_CUISINES ? results.length : 0);
          const filtered =
            cuisine !== ALL_CUISINES && q !== "" ? results.filter((meal) => meal.strMeal.toLowerCase().includes(q)) : results;
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
  const showPrompt = cuisine === ALL_CUISINES && trimmedQuery === "";

  // The search box matches meal names, so a cuisine typed into it finds
  // nothing — "Indian" is a cuisine, not a dish. Offer the cuisine instead of
  // letting the dead end stand.
  const suggestedArea =
    cuisine === ALL_CUISINES && trimmedQuery !== ""
      ? areas.find((area) => area.toLowerCase() === trimmedQuery.toLowerCase())
      : undefined;

  // The cuisine returned recipes and the name filter removed every one of
  // them. Saying "no recipes match" here hides the cause: the cook picked a
  // cuisine and still sees nothing, because of text left in the other box.
  const narrowedToNothing = cuisine !== ALL_CUISINES && trimmedQuery !== "" && cuisineTotal > 0;

  const matchingAreas =
    cuisine === ALL_CUISINES && cuisineQuery.trim() !== ""
      ? areas.filter((area) => area.toLowerCase().includes(cuisineQuery.trim().toLowerCase()))
      : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        {/* `type="search"` earns a native clear button, so wiping a query on a
            phone is one tap instead of holding backspace. The rest is about
            what iOS does to a plain text field: it capitalises the first
            letter and autocorrects as you type, which mangles dish names —
            "shchi" and "kofta" are not words it knows. Results update as you
            type, so Enter has nothing to submit; blurring is the useful thing
            it can do, since the keyboard is sitting on top of the results. */}
        <input
          className="input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="Search recipes…"
        />

        {cuisine === ALL_CUISINES ? (
          <div className="flex flex-col gap-3">
            <input
              className="input"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={cuisineQuery}
              onChange={(e) => setCuisineQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
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
              onClick={() => setCuisine(ALL_CUISINES)}
              className="tag tag-accent cursor-pointer gap-1 hover:bg-accent-700"
            >
              {cuisine}
              <span aria-hidden="true">✕</span>
              <span className="sr-only">— clear this cuisine</span>
            </button>
          </div>
        )}

        {/* Skeletons only when there's nothing on screen yet. Refining a
            search already has results showing, and replacing them with grey
            boxes on every debounced keystroke would flash the whole list —
            keeping the previous results visible while the next set loads is
            both calmer and more useful. */}
        {loading && meals.length === 0 && <RecipeListSkeleton />}
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
              cuisine={meal.strArea ?? (cuisine !== ALL_CUISINES ? cuisine : undefined)}
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
      <BottomNav />
    </div>
  );
}

export default RecipesTab;
