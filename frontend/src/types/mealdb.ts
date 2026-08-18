export interface MealDBSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

export interface MealDBMeal extends MealDBSummary {
  strArea: string;
  strCategory: string;
  strInstructions: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strIngredient16: string | null;
  strIngredient17: string | null;
  strIngredient18: string | null;
  strIngredient19: string | null;
  strIngredient20: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
  strMeasure16: string | null;
  strMeasure17: string | null;
  strMeasure18: string | null;
  strMeasure19: string | null;
  strMeasure20: string | null;
}

export interface MealIngredient {
  name: string;
  measure: string;
}

// Both take a partial meal on purpose: TheMealDB's filter endpoint returns
// only id/name/thumbnail, so a list item may legitimately be missing every
// field these read. Each then yields an empty list rather than throwing, and
// the caller decides whether "nothing to show" means hide the badge.
export const toTagList = (meal: Partial<MealDBMeal>): string[] =>
  (meal.strTags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export const toIngredientList = (meal: Partial<MealDBMeal>): MealIngredient[] => {
  const ingredients: MealIngredient[] = [];

  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}` as keyof MealDBMeal];
    const measure = meal[`strMeasure${i}` as keyof MealDBMeal];

    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), measure: (measure ?? "").trim() });
    }
  }

  return ingredients;
};
