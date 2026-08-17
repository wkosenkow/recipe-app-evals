import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { listFavorites, removeFavorite, saveFavorite } from "./favorite.controller.js";

export const favoriteRouter = Router();

favoriteRouter.use(authenticate);

favoriteRouter.get("/", listFavorites);
favoriteRouter.post("/", saveFavorite);
favoriteRouter.delete("/:mealId", removeFavorite);
