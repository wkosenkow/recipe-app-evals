import "dotenv/config";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { Recipe, type IRecipe } from "../modules/recipes/recipe.model.js";

// Placeholder recipes for early frontend development.
// Replaced by TheMealDB-sourced data once the real seed pipeline is built.
const PLACEHOLDER_RECIPES: IRecipe[] = [
  {
    title: "Spaghetti Bolognese",
    cuisine: "Italian",
    time: 45,
    difficulty: "Medium",
    baseServings: 4,
    description:
      "A slow-simmered beef and tomato sauce over pasta — the everyday Italian classic, built on browning meat and reducing wine and tomatoes into something rich.",
    equipment: [],
    ingredients: [
      { name: "Spaghetti", metricQty: 400, metricUnit: "g", imperialQty: 14, imperialUnit: "oz", allergen: "gluten" },
      { name: "Ground beef", metricQty: 500, metricUnit: "g", imperialQty: 1.1, imperialUnit: "lb", allergen: "meat" },
      { name: "Onion", metricQty: 1, metricUnit: "pc", imperialQty: 1, imperialUnit: "pc" },
      { name: "Carrot", metricQty: 1, metricUnit: "pc", imperialQty: 1, imperialUnit: "pc" },
      { name: "Garlic", metricQty: 2, metricUnit: "cloves", imperialQty: 2, imperialUnit: "cloves" },
      { name: "Canned tomatoes", metricQty: 400, metricUnit: "g", imperialQty: 14, imperialUnit: "oz" },
      { name: "Tomato paste", metricQty: 2, metricUnit: "tbsp", imperialQty: 2, imperialUnit: "tbsp" },
      {
        name: "Dry red wine",
        metricQty: 100,
        metricUnit: "ml",
        imperialQty: 0.4,
        imperialUnit: "cup",
        unavailableDefault: true,
        substitute: "beef stock plus a splash of balsamic vinegar",
      },
      { name: "Grated parmesan", metricQty: 50, metricUnit: "g", imperialQty: 0.5, imperialUnit: "cup", allergen: "dairy" },
      { name: "Olive oil", metricQty: 2, metricUnit: "tbsp", imperialQty: 2, imperialUnit: "tbsp" },
    ],
    steps: [
      { text: "Sauté the onion, carrot and garlic in olive oil for 5 minutes.", why: "softens the vegetables and releases sweetness, the base flavor of the sauce.", equipment: [] },
      { text: "Add the beef and brown it well, breaking it up with a spatula.", why: "browning (the Maillard reaction) builds the deep, roasted flavor — this is not the same as boiling it.", equipment: [] },
      { text: "Pour in the wine and reduce over high heat until it's cut by half.", why: "the alcohol evaporates, but the wine's acidity stays and balances the richness of the meat.", equipment: [] },
      { text: "Add the tomatoes and tomato paste, lower the heat, and simmer for 25-30 minutes, stirring occasionally.", why: "a slow simmer reduces the sauce and concentrates flavor without scorching it.", equipment: [] },
      { text: "Boil the spaghetti in salted water until al dente.", why: "al dente pasta still holds its shape and won't turn mushy once mixed with the hot sauce.", equipment: [] },
      { text: "Toss the pasta with the sauce over heat for 30 seconds and serve with parmesan.", why: "a brief toss helps the pasta absorb the sauce instead of just sitting under it.", equipment: [] },
    ],
  },
  {
    title: "Chicken Tikka Masala",
    cuisine: "Indian",
    time: 55,
    difficulty: "Hard",
    baseServings: 4,
    description:
      "Yogurt-marinated chicken, roasted hot and finished in a spiced tomato-cream sauce. The most involved recipe here, with a blender and oven step.",
    equipment: ["blender", "oven"],
    ingredients: [
      { name: "Chicken breast", metricQty: 600, metricUnit: "g", imperialQty: 1.3, imperialUnit: "lb", allergen: "meat" },
      { name: "Plain yogurt", metricQty: 200, metricUnit: "g", imperialQty: 0.8, imperialUnit: "cup", allergen: "dairy" },
      { name: "Onion", metricQty: 1, metricUnit: "pc", imperialQty: 1, imperialUnit: "pc" },
      { name: "Garlic", metricQty: 3, metricUnit: "cloves", imperialQty: 3, imperialUnit: "cloves" },
      { name: "Fresh ginger", metricQty: 20, metricUnit: "g", imperialQty: 0.7, imperialUnit: "oz" },
      { name: "Canned tomatoes", metricQty: 400, metricUnit: "g", imperialQty: 14, imperialUnit: "oz" },
      { name: "Heavy cream", metricQty: 100, metricUnit: "ml", imperialQty: 0.4, imperialUnit: "cup", allergen: "dairy" },
      { name: "Garam masala", metricQty: 2, metricUnit: "tsp", imperialQty: 2, imperialUnit: "tsp" },
      {
        name: "Smoked paprika",
        metricQty: 1,
        metricUnit: "tsp",
        imperialQty: 1,
        imperialUnit: "tsp",
        unavailableDefault: true,
        substitute: "regular sweet paprika, a bit less smoky",
      },
    ],
    steps: [
      { text: "Mix the yogurt with half the garlic, ginger and spices, and marinate the chicken for at least an hour.", why: "the yogurt's acidity tenderizes the fibers and lets spices penetrate deeper.", equipment: [] },
      { text: "Blend the remaining onion, garlic and ginger into a paste.", why: "a smooth paste spreads flavor evenly through the sauce.", equipment: ["blender"] },
      { text: "Roast the marinated chicken at 220°C (425°F) for 12-15 minutes until lightly charred at the edges.", why: "the oven's dry heat mimics a tandoor, charring the edges without drying out the center.", equipment: ["oven"] },
      { text: "Fry the onion paste until golden, then add the tomatoes and simmer for 10 minutes.", why: "cooks out the raw taste of onion and concentrates its sweetness.", equipment: [] },
      { text: "Add the roasted chicken and cream, and simmer gently for 5 minutes.", why: "cream softens the tomatoes' acidity and binds the sauce together.", equipment: [] },
    ],
  },
  {
    title: "Teriyaki Chicken Casserole",
    cuisine: "Japanese-American",
    time: 50,
    difficulty: "Easy",
    baseServings: 4,
    description:
      "Chicken thighs baked in a sweet-salty glaze and served over rice — the easiest recipe here, mostly hands-off oven time.",
    equipment: ["oven"],
    ingredients: [
      { name: "Chicken thighs", metricQty: 600, metricUnit: "g", imperialQty: 1.3, imperialUnit: "lb", allergen: "meat" },
      { name: "Long-grain rice", metricQty: 300, metricUnit: "g", imperialQty: 1.5, imperialUnit: "cup" },
      { name: "Soy sauce", metricQty: 80, metricUnit: "ml", imperialQty: 0.3, imperialUnit: "cup", allergen: "gluten" },
      { name: "Honey", metricQty: 3, metricUnit: "tbsp", imperialQty: 3, imperialUnit: "tbsp" },
      { name: "Garlic", metricQty: 2, metricUnit: "cloves", imperialQty: 2, imperialUnit: "cloves" },
      { name: "Fresh ginger", metricQty: 10, metricUnit: "g", imperialQty: 0.4, imperialUnit: "oz" },
      { name: "Sesame seeds", metricQty: 1, metricUnit: "tbsp", imperialQty: 1, imperialUnit: "tbsp", allergen: "nuts" },
      { name: "Green onion", metricQty: 2, metricUnit: "stalks", imperialQty: 2, imperialUnit: "stalks" },
    ],
    steps: [
      { text: "Mix soy sauce, honey, garlic and ginger, and pour over the chicken in a baking dish.", why: "honey and soy together give the classic sweet-salty balance of teriyaki.", equipment: [] },
      { text: "Bake at 200°C (400°F) for 35-40 minutes, basting with the sauce every 10 minutes.", why: "basting in layers builds a thick, sticky glaze instead of a thin puddle.", equipment: ["oven"] },
      { text: "Meanwhile, cook the rice according to the package instructions.", why: "rice is a neutral base that soaks up the sauce from the chicken.", equipment: [] },
      { text: "Remove the chicken and let it rest for 5 minutes before slicing.", why: "resting lets the juices redistribute back through the muscle fibers.", equipment: [] },
      { text: "Serve the chicken over rice, spoon over the remaining sauce, and top with sesame seeds and green onion.", why: "sesame adds crunch and a nutty accent against the dish's soft texture.", equipment: [] },
    ],
  },
];

const seed = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await Recipe.deleteMany({});
  await Recipe.insertMany(PLACEHOLDER_RECIPES);

  console.log(`Seeded ${PLACEHOLDER_RECIPES.length} placeholder recipes`);

  await mongoose.disconnect();
};

seed().catch((error: unknown) => {
  console.error("Failed to seed recipes", error);
  process.exit(1);
});
