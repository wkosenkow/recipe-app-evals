import { z } from "zod";

export const listRecipesQuerySchema = z.object({
  q: z.string().trim().optional(),
  cuisine: z.string().trim().optional(),
});
