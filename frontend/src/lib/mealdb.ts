import type { MealDBMeal, MealDBSummary } from "../types/mealdb";

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`TheMealDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const searchMealsByName = async (query: string): Promise<MealDBMeal[]> => {
  const data = await request<{ meals: MealDBMeal[] | null }>(`/search.php?s=${encodeURIComponent(query)}`);
  return data.meals ?? [];
};

export const filterMealsByArea = async (area: string): Promise<MealDBSummary[]> => {
  const data = await request<{ meals: MealDBSummary[] | null }>(`/filter.php?a=${encodeURIComponent(area)}`);
  return data.meals ?? [];
};

export const lookupMealById = async (id: string): Promise<MealDBMeal | null> => {
  const data = await request<{ meals: MealDBMeal[] | null }>(`/lookup.php?i=${encodeURIComponent(id)}`);
  return data.meals?.[0] ?? null;
};

export const listAreas = async (): Promise<string[]> => {
  const data = await request<{ meals: { strArea: string }[] }>("/list.php?a=list");
  // list.php?a=list is a world-country reference table (one row per country), not one row
  // per distinct area — several countries share the same strArea (e.g. Dominica and the
  // Dominican Republic are both "Dominican"), so dedupe before rendering.
  return Array.from(new Set(data.meals.map((meal) => meal.strArea))).sort();
};
