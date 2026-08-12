import type { Request, Response } from "express";

import { chatRequestBodySchema } from "./chat.schemas.js";
import { buildChatMessages } from "./chat.prompt.js";
import { getChatReply } from "./chat.service.js";

export const sendChatMessage = async (request: Request, response: Response): Promise<void> => {
  const validation = chatRequestBodySchema.safeParse(request.body);

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

  const messages = buildChatMessages(validation.data);
  const reply = await getChatReply(messages);

  response.status(200).json({ reply });
};
