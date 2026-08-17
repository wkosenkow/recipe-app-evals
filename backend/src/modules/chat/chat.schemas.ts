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
  equipment: z.string(),
  diet: z.string(),
});

// Every turn is replayed to the model on each request, so the prompt — and the
// per-request token cost — grows with the conversation. These caps are the
// server-side ceiling; the client trims to a smaller window before sending.
const MAX_TURN_LENGTH = 2000;
const MAX_HISTORY_TURNS = 40;

const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(MAX_TURN_LENGTH),
});

export const chatRequestBodySchema = z.object({
  recipe: recipeSchema,
  enrichment: enrichmentSchema.optional(),
  kitchenProfile: kitchenProfileSchema,
  message: z.string().min(1).max(MAX_TURN_LENGTH).optional(),
  history: z.array(chatTurnSchema).max(MAX_HISTORY_TURNS).optional(),
});

export type ChatRequestBody = z.infer<typeof chatRequestBodySchema>;
