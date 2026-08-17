import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { chatLimiter } from "../../middleware/rate-limit.js";
import { sendChatMessage } from "./chat.controller.js";

export const chatRouter = Router();

chatRouter.use(chatLimiter, authenticate);

chatRouter.post("/", sendChatMessage);
