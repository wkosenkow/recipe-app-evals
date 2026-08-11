export type UnitSystem = "metric" | "imperial";
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
export type DietRestriction = "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free";

export interface KitchenProfile {
  servings: number;
  units: UnitSystem;
  skill: SkillLevel;
  equipment: Record<string, boolean>;
  diet: DietRestriction[];
}

export const EQUIPMENT_OPTIONS: { key: string; label: string }[] = [
  { key: "blender", label: "Blender" },
  { key: "oven", label: "Oven" },
];

export const DIET_OPTIONS: { key: DietRestriction; label: string }[] = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten-free", label: "Gluten-free" },
  { key: "dairy-free", label: "Dairy-free" },
  { key: "nut-free", label: "Nut-free" },
];
