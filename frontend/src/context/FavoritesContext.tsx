import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useLocalStorage } from "../lib/use-local-storage";

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<string[]>("favorites", []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (recipeId) => favorites.includes(recipeId),
      toggleFavorite: (recipeId) =>
        setFavorites((prev) =>
          prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId],
        ),
    }),
    [favorites, setFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
