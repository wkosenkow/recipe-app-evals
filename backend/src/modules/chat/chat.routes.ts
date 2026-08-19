import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { chatLimiter } from "../../middleware/rate-limit.js";
import { sendChatMessage } from "./chat.controller.js";

export const chatRouter = Router();

// `authenticate` first, so the limiter can key on the account rather than the
// address. Keyed by IP, everyone behind one NAT — a household, a coworking
// floor, a mobile carrier's gateway — shared a single 30-request budget, while
// one person could reset theirs by moving between wifi and cellular.
//
// This does mean unauthenticated requests no longer consume the chat budget.
// They also never reach the model: `authenticate` rejects them on a JWT check
// that costs nothing, and the budget exists to bound token spend.
chatRouter.use(authenticate, chatLimiter);

chatRouter.post("/", sendChatMessage);
