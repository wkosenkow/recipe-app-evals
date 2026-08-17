import type { Request, Response } from "express";

import { saveKitchenProfileBodySchema } from "./kitchen-profile.schemas.js";
import { KitchenProfile } from "./kitchen-profile.model.js";

const DEFAULT_PROFILE = {
  servings: 4,
  units: "metric" as const,
  skill: "novice" as const,
  equipment: "",
  diet: "",
};

export const getKitchenProfile = async (request: Request, response: Response): Promise<void> => {
  const profile = await KitchenProfile.findOne({ userId: request.userId });

  response.status(200).json({ profile: profile ?? DEFAULT_PROFILE });
};

export const saveKitchenProfile = async (request: Request, response: Response): Promise<void> => {
  const validation = saveKitchenProfileBodySchema.safeParse(request.body);

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

  const profile = await KitchenProfile.findOneAndUpdate(
    { userId: request.userId },
    { userId: request.userId, ...validation.data },
    { upsert: true, new: true },
  );

  response.status(200).json({ profile });
};
