import Anthropic from "@anthropic-ai/sdk";
import { Ollama } from "ollama";

import { env } from "../../config/env.js";
import type { ChatPromptMessage } from "./chat.prompt.js";

const ollama = new Ollama({ host: env.OLLAMA_HOST });
const anthropic = env.CHAT_PROVIDER === "anthropic" ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const getOllamaReply = async (messages: ChatPromptMessage[]): Promise<string> => {
  const response = await ollama.chat({
    model: env.OLLAMA_MODEL,
    messages,
  });

  return response.message.content;
};

const getAnthropicReply = async (messages: ChatPromptMessage[]): Promise<string> => {
  const system = messages.find((message) => message.role === "system")?.content;
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));

  const response = await anthropic!.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system,
    messages: conversation,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
};

export const getChatReply = (messages: ChatPromptMessage[]): Promise<string> =>
  env.CHAT_PROVIDER === "anthropic" ? getAnthropicReply(messages) : getOllamaReply(messages);
