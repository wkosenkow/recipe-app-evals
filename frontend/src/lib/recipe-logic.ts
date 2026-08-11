import type { Recipe } from "../types/recipe";

export const missingEquipment = (
  recipe: Pick<Recipe, "equipment">,
  ownedEquipment: Record<string, boolean>,
): string[] => recipe.equipment.filter((key) => !ownedEquipment[key]);
