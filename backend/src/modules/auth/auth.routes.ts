import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { loginLimiter, registerLimiter } from "../../middleware/rate-limit.js";
import { login, logout, me, register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, register);
authRouter.post("/login", loginLimiter, login);
// Deliberately not behind authenticate: clearing the cookie has to work even
// when the session it holds is already expired or invalid.
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);
