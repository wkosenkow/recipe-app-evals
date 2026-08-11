import { Router } from "express";

import { getRecipeById, listRecipes } from "./recipe.controller.js";

export const recipeRouter = Router();

recipeRouter.get("/", listRecipes);
recipeRouter.get("/:id", getRecipeById);
