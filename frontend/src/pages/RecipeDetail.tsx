import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useFavorites } from "../context/FavoritesContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { lookupMealById } from "../lib/mealdb";
import { RECIPE_ENRICHMENT } from "../lib/recipe-enrichment";
import TabBar from "../components/TabBar";
import { EQUIPMENT_LABELS, type EquipmentKey } from "../types/kitchen";
import type { MealDBMeal } from "../types/mealdb";

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useKitchenProfile();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [meal, setMeal] = useState<MealDBMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCooking, setIsCooking] = useState(false);

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

  if (isCooking) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950 p-4">
        <button
          type="button"
          onClick={() => setIsCooking(false)}
          className="mb-4 self-start text-sm text-gray-400"
        >
          ← Back to recipe
        </button>
        <div className="text-sm text-gray-500">Chat coming soon — this is where cooking {meal.strMeal} happens.</div>
      </div>
    );
  }

  const enrichment = RECIPE_ENRICHMENT[meal.idMeal];
  const missing = enrichment?.equipment.filter((key) => !profile.equipment[key as EquipmentKey]) ?? null;
  const isReady = missing !== null && missing.length === 0;
  const favorite = isFavorite(meal.idMeal);

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
            onClick={() => toggleFavorite(meal.idMeal, meal)}
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
        </div>

        {missing !== null && (
          <div
            className={`rounded-md border px-3 py-2 text-xs font-semibold ${
              isReady
                ? "border-green-500/40 bg-green-500/15 text-green-400"
                : "border-red-500/40 bg-red-500/15 text-red-400"
            }`}
          >
            {isReady
              ? "Ready with your kitchen"
              : `Missing ${missing.map((key) => EQUIPMENT_LABELS[key as EquipmentKey] ?? key).join(", ")}`}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCooking(true)}
          className="mt-2 rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
        >
          Cook
        </button>
      </div>

      <TabBar />
    </div>
  );
}

export default RecipeDetail;
