import { describe, expect, it } from "vitest";

import { buildInstructionsText, dietConflict, missingEquipment, scaleQty } from "./recipe-logic";
import type { KitchenProfile } from "../types/kitchen";
import type { Recipe } from "../types/recipe";

const RECIPE: Recipe = {
  _id: "r1",
  title: "Test Stew",
  cuisine: "Test",
  time: 30,
  difficulty: "Easy",
  baseServings: 4,
  description: "A recipe for tests.",
  equipment: ["oven"],
  ingredients: [
    {
      name: "Ground beef",
      metricQty: 400,
      metricUnit: "g",
      imperialQty: 14,
      imperialUnit: "oz",
      allergen: "meat",
    },
    {
      name: "Dry red wine",
      metricQty: 100,
      metricUnit: "ml",
      imperialQty: 0.4,
      imperialUnit: "cup",
      unavailableDefault: true,
      substitute: "beef stock plus a splash of balsamic vinegar",
    },
  ],
  steps: [
    { text: "Brown the beef.", why: "builds flavor.", equipment: [] },
    { text: "Roast in the oven.", why: "finishes cooking evenly.", equipment: ["oven"] },
  ],
};

const baseKitchen: KitchenProfile = {
  servings: 4,
  units: "metric",
  skill: "novice",
  equipment: { oven: true, blender: false, standMixer: false, slowCooker: false, grill: false },
  diet: { veg: false, vegan: false, glutenFree: false, dairyFree: false, nutFree: false },
};

describe("scaleQty", () => {
  it("scales proportionally to servings", () => {
    expect(scaleQty(400, 8, 4)).toBe(800);
  });

  it("rounds to one decimal below 10", () => {
    expect(scaleQty(0.4, 8, 4)).toBe(0.8);
  });

  it("rounds to a whole number at or above 10", () => {
    expect(scaleQty(14, 8, 4)).toBe(28);
  });
});

describe("missingEquipment", () => {
  it("returns equipment the kitchen does not have", () => {
    expect(missingEquipment(RECIPE, { oven: false })).toEqual(["oven"]);
  });

  it("returns an empty array when the kitchen has everything", () => {
    expect(missingEquipment(RECIPE, { oven: true })).toEqual([]);
  });
});

describe("dietConflict", () => {
  it("flags an ingredient whose allergen conflicts with an active diet", () => {
    expect(dietConflict(RECIPE.ingredients[0], { ...baseKitchen.diet, vegan: true })).toBe("vegan");
  });

  it("returns undefined when no active diet conflicts", () => {
    expect(dietConflict(RECIPE.ingredients[0], baseKitchen.diet)).toBeUndefined();
  });

  it("returns undefined for ingredients with no allergen", () => {
    expect(dietConflict(RECIPE.ingredients[1], { ...baseKitchen.diet, vegan: true })).toBeUndefined();
  });
});

describe("buildInstructionsText", () => {
  it("includes the recipe title and correctly scaled ingredient lines", () => {
    const text = buildInstructionsText(RECIPE, { ...baseKitchen, servings: 8 });

    expect(text).toContain('"Test Stew"');
    expect(text).toContain("- 800 g Ground beef");
  });

  it("adds substitute text for unavailableDefault ingredients", () => {
    const text = buildInstructionsText(RECIPE, baseKitchen);

    expect(text).toContain("if unavailable, use beef stock plus a splash of balsamic vinegar");
  });

  it("flags a diet conflict inline on the ingredient line", () => {
    const text = buildInstructionsText(RECIPE, { ...baseKitchen, diet: { ...baseKitchen.diet, vegan: true } });

    expect(text).toContain("Ground beef (contains meat — flag for your diet)");
  });

  it("notes missing equipment and the step-level substitute", () => {
    const text = buildInstructionsText(RECIPE, { ...baseKitchen, equipment: { ...baseKitchen.equipment, oven: false } });

    expect(text).toContain("Your kitchen is missing: Oven — substitutes are noted above.");
    expect(text).toContain("[no oven: pan-fry covered over medium heat for about the same time, turning often]");
  });
});
