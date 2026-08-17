export type UnitSystem = "metric" | "imperial";
export type SkillLevel = "novice" | "experienced";

export interface KitchenProfile {
  servings: number;
  units: UnitSystem;
  skill: SkillLevel;
  equipment: string;
  diet: string;
}
