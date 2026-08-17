import { z } from "zod";

export const saveKitchenProfileBodySchema = z.object({
  servings: z.number().int().positive(),
  units: z.enum(["metric", "imperial"]),
  skill: z.enum(["novice", "experienced"]),
  equipment: z.string(),
  diet: z.string(),
});
