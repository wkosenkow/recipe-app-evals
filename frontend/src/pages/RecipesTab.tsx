import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiGet } from "../lib/api";
import { missingEquipment } from "../lib/recipe-logic";
import type { Recipe } from "../types/recipe";
import RecipeCard from "../components/RecipeCard";

// Wired to a real kitchen profile in the next slice — nothing owned by default for now.
const OWNED_EQUIPMENT: Record<string, boolean> = {};

function RecipesTab() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    apiGet<{ recipes: Recipe[] }>("/api/recipes")
      .then((data) => {
        if (!cancelled) setRecipes(data.recipes);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load recipes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cuisines = useMemo(
    () => ["All", ...Array.from(new Set(recipes.map((r) => r.cuisine)))],
    [recipes],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        (cuisineFilter === "All" || r.cuisine === cuisineFilter) &&
        (q === "" || r.title.toLowerCase().includes(q)),
    );
  }, [recipes, searchQuery, cuisineFilter]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-xl font-semibold text-gray-100">Recipes</div>

      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search recipes…"
        className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
      />

      <div className="flex flex-wrap gap-2">
        {cuisines.map((cuisine) => (
          <button
            key={cuisine}
            type="button"
            onClick={() => setCuisineFilter(cuisine)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              cuisine === cuisineFilter
                ? "border-blue-500/40 bg-blue-500/15 text-blue-400"
                : "border-gray-700 bg-gray-800 text-gray-400"
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500">No recipes match your search.</div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((recipe) => (
          <RecipeCard
            key={recipe._id}
            recipe={recipe}
            missingEquipment={missingEquipment(recipe, OWNED_EQUIPMENT)}
            onOpen={() => navigate(`/recipes/${recipe._id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default RecipesTab;
