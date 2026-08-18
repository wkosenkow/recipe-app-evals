import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";

import { lookupMealById } from "../lib/mealdb";
import { RecipeDetailSkeleton } from "../components/Skeletons";
import { toIngredientList, type MealDBMeal } from "../types/mealdb";
import type { RecipeContext } from "./recipe-shared";

/**
 * Layout for the three recipe views. It owns the fetch and nothing else: the
 * card, the recipe text and the AI chat are sibling routes underneath, so
 * moving between them is a real navigation rather than a `useState` swap.
 *
 * That matters most on a phone. The three used to be one component's `view`
 * state, which meant the system back gesture skipped straight out of the
 * recipe, and a reload — which iOS does by itself when it evicts a
 * backgrounded tab — dropped a cook from step 6 of a walkthrough back to the
 * card. The transcript survived on the server; the screen didn't.
 *
 * Keeping the fetch here rather than in each view is what makes switching
 * views free: the meal is already in hand, so no view refetches it.
 */
function RecipeDetail() {
  const { id } = useParams<{ id: string }>();

  const [meal, setMeal] = useState<MealDBMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <RecipeDetailSkeleton />;
  }

  if (error || !meal) {
    return <div className="p-6 text-sm text-danger">{error ?? "Recipe not found"}</div>;
  }

  const context: RecipeContext = { meal, ingredients: toIngredientList(meal) };

  return <Outlet context={context} />;
}

export default RecipeDetail;
