import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { loginLimiter, registerLimiter } from "../../middleware/rate-limit.js";
import { login, me, register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, register);
authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", authenticate, me);
