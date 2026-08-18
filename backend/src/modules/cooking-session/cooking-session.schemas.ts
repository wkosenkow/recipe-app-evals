import { z } from "zod";

// Deliberately not chat.schemas.ts's own 2000/40 — those exist to bound the
// LLM prompt's token cost on every replay, which doesn't apply here: this
// body is never sent to a model, just stored so the cook can resume it.
// Rejecting (or, worse, silently truncating) a genuine reply because it's
// "too long to save" would mean the cook opens their walkthrough later to
// find it cut off mid-step — actually caught live-testing this: a single
// real opening reply ran 2927 characters and 400'd against the chat cap.
// These are a sanity ceiling against a pathological payload, not a product
// constraint — at 200 × 20000 chars a worst-case document still sits well
// under MongoDB's 16MB limit, with no realistic conversation coming close.
const MAX_TURN_LENGTH = 20_000;
const MAX_HISTORY_TURNS = 200;

const cookingSessionMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(MAX_TURN_LENGTH),
});

export const saveCookingSessionBodySchema = z.object({
  messages: z.array(cookingSessionMessageSchema).max(MAX_HISTORY_TURNS),
});
