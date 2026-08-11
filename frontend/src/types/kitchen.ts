export type UnitSystem = "metric" | "imperial";
export type SkillLevel = "novice" | "experienced";

export type EquipmentKey = "oven" | "blender" | "standMixer" | "slowCooker" | "grill";
export type DietKey = "veg" | "vegan" | "glutenFree" | "dairyFree" | "nutFree";

export interface KitchenProfile {
  servings: number;
  units: UnitSystem;
  skill: SkillLevel;
  equipment: Record<EquipmentKey, boolean>;
  diet: Record<DietKey, boolean>;
}

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  oven: "Oven",
  blender: "Blender",
  standMixer: "Stand mixer",
  slowCooker: "Slow cooker",
  grill: "Grill",
};

export const DIET_LABELS: Record<DietKey, string> = {
  veg: "Vegetarian",
  vegan: "Vegan",
  glutenFree: "Gluten-free",
  dairyFree: "Dairy-free",
  nutFree: "Nut-free",
};
