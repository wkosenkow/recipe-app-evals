import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { getCookingSession, saveCookingSession } from "./cooking-session.controller.js";

export const cookingSessionRouter = Router();

cookingSessionRouter.use(authenticate);

cookingSessionRouter.get("/:mealId", getCookingSession);
cookingSessionRouter.put("/:mealId", saveCookingSession);
