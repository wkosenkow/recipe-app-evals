import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { getKitchenProfile, saveKitchenProfile } from "./kitchen-profile.controller.js";

export const kitchenProfileRouter = Router();

kitchenProfileRouter.use(authenticate);

kitchenProfileRouter.get("/", getKitchenProfile);
kitchenProfileRouter.put("/", saveKitchenProfile);
