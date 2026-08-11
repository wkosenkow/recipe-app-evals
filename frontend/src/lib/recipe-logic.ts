import type { DietKey, EquipmentKey, KitchenProfile } from "../types/kitchen";
import { EQUIPMENT_LABELS } from "../types/kitchen";
import type { Ingredient, Recipe } from "../types/recipe";

export const DIET_CONFLICTS: Record<DietKey, NonNullable<Ingredient["allergen"]>[]> = {
  veg: ["meat"],
  vegan: ["meat", "dairy"],
  glutenFree: ["gluten"],
  dairyFree: ["dairy"],
  nutFree: ["nuts"],
};

export const EQUIPMENT_SUBSTITUTE: Record<EquipmentKey, string> = {
  blender: "no blender: finely grate the onion, garlic and ginger, or crush them with a mortar and pestle",
  oven: "no oven: pan-fry covered over medium heat for about the same time, turning often",
  standMixer: "no stand mixer: whisk by hand, it will take 2-3x longer",
  slowCooker: 'have a slow cooker: cook on the "stew" setting for about twice as long, covered',
  grill: "no grill: use a dry grill pan or a regular pan over high heat instead",
};

const ALLERGEN_LABELS: Record<NonNullable<Ingredient["allergen"]>, string> = {
  meat: "meat",
  dairy: "dairy",
  gluten: "gluten",
  nuts: "nuts",
};

export const missingEquipment = (
  recipe: Pick<Recipe, "equipment">,
  ownedEquipment: Record<string, boolean>,
): string[] => recipe.equipment.filter((key) => !ownedEquipment[key]);

export const scaleQty = (base: number, servings: number, baseServings: number): number => {
  const v = (base * servings) / baseServings;
  return v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
};

export const dietConflict = (
  ingredient: Ingredient,
  diet: Record<DietKey, boolean>,
): DietKey | undefined => {
  if (!ingredient.allergen) return undefined;
  const allergen = ingredient.allergen;
  return (Object.keys(DIET_CONFLICTS) as DietKey[]).find(
    (key) => diet[key] && DIET_CONFLICTS[key].includes(allergen),
  );
};

export const buildInstructionsText = (recipe: Recipe, kitchen: KitchenProfile): string => {
  const servings = kitchen.servings || recipe.baseServings;
  const missing = missingEquipment(recipe, kitchen.equipment);
  const lines: string[] = [];

  lines.push(
    `Here is "${recipe.title}" for ${servings} serving${servings === 1 ? "" : "s"} (${
      kitchen.units === "imperial" ? "cups/oz" : "grams/ml"
    }):`,
  );
  lines.push("");
  lines.push("Ingredients:");

  recipe.ingredients.forEach((ingredient) => {
    const qty = kitchen.units === "imperial" ? ingredient.imperialQty : ingredient.metricQty;
    const unit = kitchen.units === "imperial" ? ingredient.imperialUnit : ingredient.metricUnit;
    const scaled = scaleQty(qty, servings, recipe.baseServings);
    let line = `- ${scaled} ${unit} ${ingredient.name}`;

    const conflict = dietConflict(ingredient, kitchen.diet);
    if (conflict && ingredient.allergen) {
      line += ` (contains ${ALLERGEN_LABELS[ingredient.allergen]} — flag for your diet)`;
    }
    if (ingredient.unavailableDefault) {
      line += ` — if unavailable, use ${ingredient.substitute || "a similar product"}`;
    }

    lines.push(line);
  });

  lines.push("");
  lines.push("Steps:");

  recipe.steps.forEach((step, i) => {
    let line = `${i + 1}. ${step.text} (${step.why})`;
    const stepMissing = step.equipment.filter((key) => !kitchen.equipment[key as EquipmentKey]);
    if (stepMissing.length > 0) {
      line += ` [${stepMissing.map((key) => EQUIPMENT_SUBSTITUTE[key as EquipmentKey]).join("; ")}]`;
    }
    lines.push(line);
  });

  if (missing.length > 0) {
    lines.push("");
    lines.push(
      `Your kitchen is missing: ${missing.map((key) => EQUIPMENT_LABELS[key as EquipmentKey]).join(", ")} — substitutes are noted above.`,
    );
  }

  lines.push("");
  lines.push(
    "Want to change anything — servings, diet, spice level, equipment, or how much detail you want per step? Just tell me.",
  );

  return lines.join("\n");
};
