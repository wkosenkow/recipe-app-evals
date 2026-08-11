import { z } from "zod";

const ingredientNoteSchema = z.object({
  ingredient: z.string(),
  allergen: z.enum(["meat", "dairy", "gluten", "nuts"]).optional(),
  substitute: z.string().optional(),
});

const enrichmentSchema = z.object({
  equipment: z.array(z.string()),
  ingredientNotes: z.array(ingredientNoteSchema),
});

export const saveFavoriteBodySchema = z.object({
  mealId: z.string().min(1),
  title: z.string().min(1),
  cuisine: z.string().min(1),
  thumbnail: z.string().min(1),
  ingredients: z.array(z.object({ name: z.string(), measure: z.string() })),
  instructions: z.string().min(1),
  enrichment: enrichmentSchema.optional(),
});
