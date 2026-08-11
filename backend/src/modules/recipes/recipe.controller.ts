import type { Request, Response } from "express";

import { listRecipesQuerySchema } from "./recipe.schemas.js";
import { Recipe } from "./recipe.model.js";

export const listRecipes = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const validation = listRecipesQuerySchema.safeParse(request.query);

  if (!validation.success) {
    response.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const { q, cuisine } = validation.data;

  const filter: Record<string, unknown> = {};

  if (q) {
    filter.title = { $regex: q, $options: "i" };
  }

  if (cuisine && cuisine !== "All") {
    filter.cuisine = cuisine;
  }

  const recipes = await Recipe.find(filter).sort({ title: 1 });

  response.status(200).json({ recipes });
};

export const getRecipeById = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const recipe = await Recipe.findById(request.params.id);

  if (!recipe) {
    response.status(404).json({ message: "Recipe not found" });
    return;
  }

  response.status(200).json({ recipe });
};
