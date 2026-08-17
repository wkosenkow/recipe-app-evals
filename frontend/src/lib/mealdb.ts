import type { MealDBMeal, MealDBSummary } from "../types/mealdb";

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`TheMealDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const areaCountryMap = new Map<string, string>();

export const searchMealsByName = async (query: string): Promise<MealDBMeal[]> => {
  const data = await request<{ meals: MealDBMeal[] | null }>(`/search.php?s=${encodeURIComponent(query)}`);
  return data.meals ?? [];
};

export const filterMealsByArea = async (area: string): Promise<MealDBSummary[]> => {
  const data = await request<{ meals: MealDBSummary[] | null }>(`/filter.php?a=${encodeURIComponent(area)}`);
  if (data.meals && data.meals.length > 0) {
    return data.meals;
  }

  // TheMealDB list.php?a=list returns demographic adjectives (e.g. "Indian", "French", "American"),
  // but meals in its database are often indexed under the country name (e.g. "India", "France", "United States").
  // If the initial filter query returns null/empty, fall back to querying the corresponding country name.
  const country = areaCountryMap.get(area.toLowerCase());
  if (country && country.toLowerCase() !== area.toLowerCase()) {
    const fallbackData = await request<{ meals: MealDBSummary[] | null }>(
      `/filter.php?a=${encodeURIComponent(country)}`,
    );
    if (fallbackData.meals && fallbackData.meals.length > 0) {
      return fallbackData.meals;
    }
  }

  return [];
};

export const lookupMealById = async (id: string): Promise<MealDBMeal | null> => {
  const data = await request<{ meals: MealDBMeal[] | null }>(`/lookup.php?i=${encodeURIComponent(id)}`);
  return data.meals?.[0] ?? null;
};

export const listAreas = async (): Promise<string[]> => {
  const data = await request<{ meals: { strArea: string; strCountry?: string }[] }>("/list.php?a=list");
  for (const meal of data.meals) {
    if (meal.strArea && meal.strCountry) {
      areaCountryMap.set(meal.strArea.toLowerCase(), meal.strCountry);
    }
  }
  // list.php?a=list is a world-country reference table (one row per country), not one row
  // per distinct area — several countries share the same strArea (e.g. Dominica and the
  // Dominican Republic are both "Dominican"), so dedupe before rendering.
  return Array.from(new Set(data.meals.map((meal) => meal.strArea))).sort();
};
