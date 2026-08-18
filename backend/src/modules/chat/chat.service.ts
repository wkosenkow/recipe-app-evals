import Anthropic from "@anthropic-ai/sdk";
import { Ollama } from "ollama";

import { env } from "../../config/env.js";
import type { ChatPromptMessage } from "./chat.prompt.js";

const ollama = new Ollama({ host: env.OLLAMA_HOST });
const anthropic = env.CHAT_PROVIDER === "anthropic" ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

// Anthropic wants the system prompt as its own field rather than as a turn in
// the conversation, so it has to be lifted out of the message list.
const splitSystemPrompt = (messages: ChatPromptMessage[]) => ({
  system: messages.find((message) => message.role === "system")?.content,
  conversation: messages
    .filter((message) => message.role !== "system")
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
});

async function* streamOllamaReply(
  messages: ChatPromptMessage[],
  signal: AbortSignal,
): AsyncGenerator<string> {
  const stream = await ollama.chat({ model: env.OLLAMA_MODEL, messages, stream: true });

  // Abort this iterator, not `ollama.abort()` — the client is shared across
  // requests and its abort() cancels every in-flight stream on it, so one
  // user closing a tab would cut off everyone else's reply.
  const abort = () => stream.abort();
  signal.addEventListener("abort", abort, { once: true });

  try {
    for await (const chunk of stream) {
      if (chunk.message.content) yield chunk.message.content;
    }
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

async function* streamAnthropicReply(
  messages: ChatPromptMessage[],
  signal: AbortSignal,
): AsyncGenerator<string> {
  const { system, conversation } = splitSystemPrompt(messages);

  const stream = anthropic!.messages.stream({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system,
    messages: conversation,
  });

  const abort = () => stream.abort();
  signal.addEventListener("abort", abort, { once: true });

  try {
    for await (const event of stream) {
      // A reply can contain several content blocks; only text deltas carry
      // words for the reader.
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

/**
 * Yields the reply as it is generated, one text delta at a time.
 *
 * Aborting `signal` cancels the request at the provider — which is the point:
 * once the reader has gone away, continuing to generate is billable work
 * nobody will ever see. Both providers surface the cancellation by throwing
 * out of the loop, so callers should treat a throw with `signal.aborted` set
 * as a normal end rather than a failure.
 */
export const streamChatReply = (
  messages: ChatPromptMessage[],
  signal: AbortSignal,
): AsyncGenerator<string> =>
  env.CHAT_PROVIDER === "anthropic"
    ? streamAnthropicReply(messages, signal)
    : streamOllamaReply(messages, signal);
