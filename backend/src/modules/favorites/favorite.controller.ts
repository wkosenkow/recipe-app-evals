import type { Request, Response } from "express";

import { saveFavoriteBodySchema } from "./favorite.schemas.js";
import { Favorite } from "./favorite.model.js";

export const listFavorites = async (_request: Request, response: Response): Promise<void> => {
  const favorites = await Favorite.find().sort({ createdAt: -1 });

  response.status(200).json({ favorites });
};

export const saveFavorite = async (request: Request, response: Response): Promise<void> => {
  const validation = saveFavoriteBodySchema.safeParse(request.body);

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

  const favorite = await Favorite.findOneAndUpdate(
    { mealId: validation.data.mealId },
    validation.data,
    { upsert: true, new: true },
  );

  response.status(201).json({ favorite });
};

export const removeFavorite = async (request: Request, response: Response): Promise<void> => {
  await Favorite.deleteOne({ mealId: request.params.mealId });

  response.status(204).send();
};
