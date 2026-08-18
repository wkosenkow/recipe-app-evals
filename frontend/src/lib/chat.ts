import { API_URL, ApiError } from "./api";
import type { KitchenProfile } from "../types/kitchen";
import type { MealIngredient } from "../types/mealdb";

export interface ChatRecipe {
  title: string;
  cuisine: string;
  ingredients: MealIngredient[];
  instructions: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface SendChatMessageParams {
  recipe: ChatRecipe;
  kitchenProfile: KitchenProfile;
  message?: string;
  history?: ChatMessage[];
}

interface StreamOptions {
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * A reply that started arriving and then broke off.
 *
 * `partial` is what the model actually managed to say. It is genuine output
 * rather than an invented apology, so the caller may keep it — but it must
 * know the reply is unfinished, which is the whole reason this is an error
 * and not a resolved value.
 */
export class ChatStreamError extends Error {
  partial: string;

  constructor(message: string, partial: string) {
    super(message);
    this.name = "ChatStreamError";
    this.partial = partial;
  }
}

// The whole history is replayed to the model every turn, so an unbounded
// conversation means a prompt — and a bill — that grows with each message.
// Keep the most recent turns; the backend enforces a hard ceiling of its own.
const HISTORY_WINDOW = 20;

// Mirrors chat.schemas.ts's own per-turn cap — keep the two in sync. The
// model's own replies aren't bounded by much: Anthropic's max_tokens (1024)
// alone permits well past 2000 characters, and Ollama has no cap at all. A
// long opening walkthrough easily exceeds this, and replaying it verbatim as
// history on the very next turn would then get the whole request rejected by
// the server's own validation — which is exactly what happened testing this
// screen (a 2546-character opening reply 400'd the next quick pick). The cap
// exists to keep the conversation's token cost bounded, not to guarantee any
// one turn's fidelity, so clipping a turn that's too long serves the same
// goal as rejecting it — degrading gracefully instead of breaking the chat.
export const MAX_TURN_LENGTH = 2000;
const TRUNCATION_MARKER = " […truncated]";

const clipTurn = (turn: ChatMessage): ChatMessage =>
  turn.text.length <= MAX_TURN_LENGTH
    ? turn
    : { ...turn, text: turn.text.slice(0, MAX_TURN_LENGTH - TRUNCATION_MARKER.length) + TRUNCATION_MARKER };

type ChatStreamFrame = { type: "delta"; text: string } | { type: "done" } | { type: "error" };

/**
 * Streams a reply, calling `onDelta` with each piece as it arrives, and
 * resolving with the complete text.
 *
 * Throws {@link ChatStreamError} if the reply broke off partway — including
 * when the connection simply ends without the server's closing frame, which is
 * otherwise indistinguishable from a finished reply.
 */
export const streamChatMessage = async (
  { recipe, kitchenProfile, message, history }: SendChatMessageParams,
  { onDelta, signal }: StreamOptions,
): Promise<string> => {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    // The session is an httpOnly cookie the browser attaches for us.
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipe,
      kitchenProfile,
      message,
      history: history?.slice(-HISTORY_WINDOW).map(clipTurn),
    }),
    signal,
  });

  // The server withholds the streaming headers until it has something to say,
  // so failures still arrive as ordinary JSON with a status code.
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? "Request failed");
  }

  if (!response.body) {
    throw new ChatStreamError("Response had no body", "");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let terminated = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Frames are separated by a blank line; anything after the last one is
      // an incomplete frame still in flight, so it stays in the buffer.
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");

        if (!raw.startsWith("data: ")) continue;

        const frame = JSON.parse(raw.slice(6)) as ChatStreamFrame;

        if (frame.type === "delta") {
          reply += frame.text;
          onDelta(frame.text);
        } else {
          if (frame.type === "error") {
            throw new ChatStreamError("The reply broke off", reply);
          }
          terminated = true;
        }
      }
    }
  } finally {
    // Releasing the lock lets the body be discarded when we leave early;
    // without it an abandoned response can hold its connection open.
    reader.releaseLock();
  }

  if (!terminated) {
    // The connection ended without the closing frame. Treating this as success
    // would file a truncated answer away as complete and replay it to the
    // model on the next turn as something it actually finished saying.
    throw new ChatStreamError("The reply broke off", reply);
  }

  return reply;
};
