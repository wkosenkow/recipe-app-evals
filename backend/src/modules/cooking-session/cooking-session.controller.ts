import type { Request, Response } from "express";

import { saveCookingSessionBodySchema } from "./cooking-session.schemas.js";
import { CookingSession } from "./cooking-session.model.js";

export const getCookingSession = async (request: Request, response: Response): Promise<void> => {
  const session = await CookingSession.findOne({ userId: request.userId, mealId: request.params.mealId });

  response.status(200).json({ messages: session?.messages ?? [] });
};

export const saveCookingSession = async (request: Request, response: Response): Promise<void> => {
  const validation = saveCookingSessionBodySchema.safeParse(request.body);

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

  const session = await CookingSession.findOneAndUpdate(
    { userId: request.userId, mealId: request.params.mealId },
    { userId: request.userId, mealId: request.params.mealId, messages: validation.data.messages },
    { upsert: true, new: true },
  );

  response.status(200).json({ messages: session.messages });
};
