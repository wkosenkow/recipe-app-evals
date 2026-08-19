import type { Request, Response } from "express";

import { saveFavoriteBodySchema } from "./favorite.schemas.js";
import { Favorite } from "./favorite.model.js";

// Favorites carry a full recipe snapshot each — ingredients and instructions
// included — so an unbounded find is a response that grows without limit on a
// phone connection. This is a ceiling, not pagination: nobody saving recipes by
// hand reaches it, and adding paging to a screen that has never needed it would
// be machinery with no user.
const MAX_FAVORITES = 100;

export const listFavorites = async (request: Request, response: Response): Promise<void> => {
  const favorites = await Favorite.find({ userId: request.userId })
    .sort({ createdAt: -1 })
    .limit(MAX_FAVORITES);

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
    { userId: request.userId, mealId: validation.data.mealId },
    { userId: request.userId, ...validation.data },
    { upsert: true, new: true },
  );

  response.status(201).json({ favorite });
};

export const removeFavorite = async (request: Request, response: Response): Promise<void> => {
  await Favorite.deleteOne({ userId: request.userId, mealId: request.params.mealId });

  response.status(204).send();
};
