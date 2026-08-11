import { Router } from "express";

import { listFavorites, removeFavorite, saveFavorite } from "./favorite.controller.js";

export const favoriteRouter = Router();

favoriteRouter.get("/", listFavorites);
favoriteRouter.post("/", saveFavorite);
favoriteRouter.delete("/:mealId", removeFavorite);
