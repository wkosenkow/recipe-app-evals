import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string().min(1),
  measure: z.string(),
});

const ingredientNoteSchema = z.object({
  ingredient: z.string().min(1),
  allergen: z.enum(["meat", "dairy", "gluten", "nuts"]).optional(),
  substitute: z.string().optional(),
});

const enrichmentSchema = z.object({
  equipment: z.array(z.string()),
  ingredientNotes: z.array(ingredientNoteSchema),
});

const recipeSchema = z.object({
  title: z.string().min(1),
  cuisine: z.string().min(1),
  ingredients: z.array(ingredientSchema),
  instructions: z.string().min(1),
});

const kitchenProfileSchema = z.object({
  servings: z.number().int().positive(),
  units: z.enum(["metric", "imperial"]),
  skill: z.enum(["novice", "experienced"]),
  equipment: z.record(z.string(), z.boolean()),
  diet: z.record(z.string(), z.boolean()),
});

const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1),
});

export const chatRequestBodySchema = z.object({
  recipe: recipeSchema,
  enrichment: enrichmentSchema.optional(),
  kitchenProfile: kitchenProfileSchema,
  message: z.string().min(1).optional(),
  history: z.array(chatTurnSchema).optional(),
});

export type ChatRequestBody = z.infer<typeof chatRequestBodySchema>;
