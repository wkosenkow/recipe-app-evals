import { Ollama } from "ollama";

import { env } from "../../config/env.js";
import type { OllamaChatMessage } from "./chat.prompt.js";

const ollama = new Ollama({ host: env.OLLAMA_HOST });

export const getChatReply = async (messages: OllamaChatMessage[]): Promise<string> => {
  const response = await ollama.chat({
    model: env.OLLAMA_MODEL,
    messages,
  });

  return response.message.content;
};
