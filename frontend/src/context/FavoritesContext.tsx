import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { apiDelete, apiGet, apiPost } from "../lib/api";
import { lookupMealById } from "../lib/mealdb";
import { toIngredientList, type MealDBMeal } from "../types/mealdb";
import type { Favorite } from "../types/favorite";

interface FavoritesContextValue {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  isFavorite: (mealId: string) => boolean;
  toggleFavorite: (mealId: string, meal?: MealDBMeal) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGet<{ favorites: Favorite[] }>("/api/favorites")
      .then((data) => setFavorites(data.favorites))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load favorites"))
      .finally(() => setLoading(false));
  }, [user]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      loading,
      error,
      isFavorite: (mealId) => favorites.some((favorite) => favorite.mealId === mealId),
      toggleFavorite: async (mealId, meal) => {
        if (favorites.some((favorite) => favorite.mealId === mealId)) {
          await apiDelete(`/api/favorites/${mealId}`);
          setFavorites((prev) => prev.filter((favorite) => favorite.mealId !== mealId));
          // Raised after the request settles, not before it: a confirmation
          // that appears whether or not the server agreed isn't a
          // confirmation. A failure throws past this and leaves no toast.
          showToast("Removed from favorites");
          return;
        }

        const fullMeal = meal ?? (await lookupMealById(mealId));
        if (!fullMeal) return;

        const data = await apiPost<{ favorite: Favorite }>("/api/favorites", {
          mealId,
          title: fullMeal.strMeal,
          cuisine: fullMeal.strArea,
          thumbnail: fullMeal.strMealThumb,
          ingredients: toIngredientList(fullMeal),
          instructions: fullMeal.strInstructions,
        });

        setFavorites((prev) => [data.favorite, ...prev]);
        showToast("Saved to favorites");
      },
    }),
    [favorites, loading, error, showToast],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
