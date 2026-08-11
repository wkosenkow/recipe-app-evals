import { useEffect, useState } from "react";

import { apiGet } from "./api";
import type { Recipe } from "../types/recipe";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { recipes, loading, error };
}
