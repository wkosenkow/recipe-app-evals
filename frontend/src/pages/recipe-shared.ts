import { useOutletContext } from "react-router-dom";

import type { MealDBMeal, MealIngredient } from "../types/mealdb";

/**
 * What `RecipeDetail` hands to whichever of its three views is routed to.
 * Kept in its own module rather than exported from the layout so neither file
 * mixes a component export with a non-component one — the same reason the
 * contexts keep their hooks beside them.
 */
export interface RecipeContext {
  meal: MealDBMeal;
  ingredients: MealIngredient[];
}

export function useRecipe(): RecipeContext {
  return useOutletContext<RecipeContext>();
}

/** Silkscreen at 9px, the design's section label. Not `.card-kicker` — that
 *  one is the accent-coloured 10px uppercase variant used on deck cards. */
export const KICKER = "font-pixel text-[9px] tracking-[0.5px] text-neutral-500";
