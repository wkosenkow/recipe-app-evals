export type AllergenType = "meat" | "dairy" | "gluten" | "nuts";

export interface IngredientNote {
  ingredient: string;
  allergen?: AllergenType;
  substitute?: string;
}

export interface RecipeEnrichment {
  equipment: string[];
  ingredientNotes: IngredientNote[];
}

/**
 * Hand-authored overlay for a curated subset of TheMealDB recipes (7 Russian + 6 Mexican,
 * researched this session). Keyed by TheMealDB's mealId. Recipes outside this set have no
 * overlay — the chat prompt just works from the raw ingredient/instructions text for those.
 */
export const RECIPE_ENRICHMENT: Record<string, RecipeEnrichment> = {
  // Russian
  "52834": {
    // Beef stroganoff
    equipment: [],
    ingredientNotes: [
      { ingredient: "Beef Fillet", allergen: "meat" },
      { ingredient: "Butter", allergen: "dairy" },
      { ingredient: "Creme Fraiche", allergen: "dairy" },
      { ingredient: "Plain Flour", allergen: "gluten" },
      {
        ingredient: "English Mustard",
        substitute: "Dijon mustard, or dry mustard powder mixed with a splash of vinegar",
      },
    ],
  },
  "53083": {
    // Lamb Pilaf (Plov)
    equipment: [],
    ingredientNotes: [
      { ingredient: "Lamb", allergen: "meat" },
      { ingredient: "Butter", allergen: "dairy" },
      { ingredient: "Prunes", substitute: "dried apricots, roughly chopped" },
    ],
  },
  "53080": {
    // Blini Pancakes
    equipment: ["standMixer"],
    ingredientNotes: [
      { ingredient: "Flour", allergen: "gluten" },
      { ingredient: "Milk", allergen: "dairy" },
      { ingredient: "Butter", allergen: "dairy" },
    ],
  },
  "53077": {
    // Cabbage Soup (Shchi)
    equipment: [],
    ingredientNotes: [
      { ingredient: "Unsalted Butter", allergen: "dairy" },
      { ingredient: "Sour Cream", allergen: "dairy", substitute: "plain yogurt" },
    ],
  },
  "53079": {
    // Fish Soup (Ukha)
    equipment: [],
    ingredientNotes: [],
  },
  "53081": {
    // Potato Salad (Olivier Salad)
    equipment: [],
    ingredientNotes: [{ ingredient: "Sausages", allergen: "meat" }],
  },
  "53082": {
    // Strawberries Romanoff
    equipment: ["standMixer"],
    ingredientNotes: [
      { ingredient: "Cream", allergen: "dairy" },
      { ingredient: "Sour Cream", allergen: "dairy" },
      { ingredient: "Grand Marnier", substitute: "orange juice with a few drops of vanilla extract" },
    ],
  },

  // Mexican
  "52826": {
    // Braised Beef Chilli
    equipment: ["oven", "blender"],
    ingredientNotes: [
      { ingredient: "Beef", allergen: "meat" },
      { ingredient: "Chorizo", allergen: "meat" },
      {
        ingredient: "Ancho Chillies",
        substitute: "2 tbsp mild chilli powder plus a pinch of smoked paprika",
      },
    ],
  },
  "52819": {
    // Cajun spiced fish tacos
    equipment: [],
    ingredientNotes: [
      { ingredient: "flour tortilla", allergen: "gluten" },
      { ingredient: "sour cream", allergen: "dairy" },
    ],
  },
  "52765": {
    // Chicken Enchilada Casserole
    equipment: ["oven"],
    ingredientNotes: [
      { ingredient: "chicken breasts", allergen: "meat" },
      { ingredient: "shredded Monterey Jack cheese", allergen: "dairy" },
    ],
  },
  "52870": {
    // Chickpea Fajitas
    equipment: ["oven", "grill"],
    ingredientNotes: [{ ingredient: "Sour Cream", allergen: "dairy" }],
  },
  "52830": {
    // Crock Pot Chicken Baked Tacos
    equipment: ["slowCooker", "oven"],
    ingredientNotes: [
      { ingredient: "Chicken Breasts", allergen: "meat" },
      { ingredient: "Shredded Mexican Cheese", allergen: "dairy" },
      { ingredient: "Sour Cream", allergen: "dairy" },
      { ingredient: "Milk", allergen: "dairy" },
    ],
  },
  "53067": {
    // Stuffed Bell Peppers with Quinoa and Black Beans
    equipment: ["oven"],
    ingredientNotes: [
      {
        ingredient: "Shredded Mexican Cheese",
        allergen: "dairy",
        substitute: "any melting cheese you have, or a plant-based alternative",
      },
    ],
  },
};
