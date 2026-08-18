import type { MealDBMeal, MealDBSummary } from "../types/mealdb";

/** What `filter.php` actually returns today: a summary plus its own cuisine. */
export type MealDBFilterResult = MealDBSummary & { strArea?: string };

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`TheMealDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

interface AreaReference {
  /** Distinct cuisine adjectives, sorted — what the cuisine filter offers. */
  areas: string[];
  /** "indian" → "India". Used to retry a filter under the country name. */
  areaToCountry: Map<string, string>;
  /** "india" → "Indian". Used to normalise a meal's own strArea. */
  countryToArea: Map<string, string>;
}

const EMPTY_REFERENCE: AreaReference = {
  areas: [],
  areaToCountry: new Map(),
  countryToArea: new Map(),
};

let referencePromise: Promise<AreaReference> | null = null;

// `list.php?a=list` is a static world reference table — 195 rows of
// (adjective, country). Fetched at most once per page load and shared by
// every caller that needs either direction of the mapping.
const loadAreaReference = (): Promise<AreaReference> => {
  referencePromise ??= request<{ meals: { strArea: string; strCountry?: string }[] }>("/list.php?a=list")
    .then((data) => {
      const areaToCountry = new Map<string, string>();
      const countryToArea = new Map<string, string>();

      for (const row of data.meals) {
        if (!row.strArea || !row.strCountry) continue;
        areaToCountry.set(row.strArea.toLowerCase(), row.strCountry);
        countryToArea.set(row.strCountry.toLowerCase(), row.strArea);
      }

      // One row per country, not per distinct area — several countries share
      // an adjective (Dominica and the Dominican Republic are both
      // "Dominican"), so dedupe before this reaches the filter UI.
      return {
        areas: Array.from(new Set(data.meals.map((row) => row.strArea))).sort(),
        areaToCountry,
        countryToArea,
      };
    })
    .catch((error: unknown) => {
      // Don't cache a failure: a later call should get to try again. Callers
      // degrade to unnormalised labels rather than breaking.
      referencePromise = null;
      throw error;
    });

  return referencePromise;
};

// TheMealDB is inconsistent about which half of that table a meal's own
// strArea comes from — "Chinese" and "Japanese" sit next to "India" and
// "France" in the same result set, which reads as a bug in the recipe list.
// Normalising to the adjective makes the labels agree with each other and
// with the cuisine filter's own vocabulary.
const toCuisineLabel = (reference: AreaReference, area: string | undefined): string | undefined =>
  area ? (reference.countryToArea.get(area.toLowerCase()) ?? area) : area;

const withNormalisedArea = <T extends { strArea?: string }>(reference: AreaReference, meal: T): T => ({
  ...meal,
  strArea: toCuisineLabel(reference, meal.strArea),
});

// Normalising here rather than at each render keeps every downstream consumer
// consistent for free — the card label, the recipe page's tag, the cuisine
// saved into a favorite's snapshot, and the cuisine handed to the chat prompt.
const referenceOrEmpty = (): Promise<AreaReference> => loadAreaReference().catch(() => EMPTY_REFERENCE);

export const searchMealsByName = async (query: string): Promise<MealDBMeal[]> => {
  // In parallel: the search itself doesn't depend on the reference table, so
  // waiting for them in sequence would add a needless round trip.
  const [data, reference] = await Promise.all([
    request<{ meals: MealDBMeal[] | null }>(`/search.php?s=${encodeURIComponent(query)}`),
    referenceOrEmpty(),
  ]);

  return (data.meals ?? []).map((meal) => withNormalisedArea(reference, meal));
};

// Despite the name, this endpoint does return each meal's own strArea — and
// under whichever spelling the meal was indexed with, so its rows need the
// same normalising as a search's. (MealDBSummary predates that: the endpoint
// used to return only id/name/thumbnail.)
export const filterMealsByArea = async (area: string): Promise<MealDBFilterResult[]> => {
  const [data, reference] = await Promise.all([
    request<{ meals: MealDBFilterResult[] | null }>(`/filter.php?a=${encodeURIComponent(area)}`),
    referenceOrEmpty(),
  ]);

  if (data.meals && data.meals.length > 0) {
    return data.meals.map((meal) => withNormalisedArea(reference, meal));
  }

  // The filter is keyed by the adjective, but meals are often indexed under
  // the country name instead ("Indian" finds nothing, "India" finds 14), so
  // an empty first answer is worth one retry under the other name.
  const country = reference.areaToCountry.get(area.toLowerCase());

  if (country && country.toLowerCase() !== area.toLowerCase()) {
    const fallbackData = await request<{ meals: MealDBFilterResult[] | null }>(
      `/filter.php?a=${encodeURIComponent(country)}`,
    );
    if (fallbackData.meals && fallbackData.meals.length > 0) {
      return fallbackData.meals.map((meal) => withNormalisedArea(reference, meal));
    }
  }

  return [];
};

export const lookupMealById = async (id: string): Promise<MealDBMeal | null> => {
  const [data, reference] = await Promise.all([
    request<{ meals: MealDBMeal[] | null }>(`/lookup.php?i=${encodeURIComponent(id)}`),
    referenceOrEmpty(),
  ]);

  const meal = data.meals?.[0];
  return meal ? withNormalisedArea(reference, meal) : null;
};

export const listAreas = async (): Promise<string[]> => (await loadAreaReference()).areas;
