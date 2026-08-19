// ipKeyGenerator is the library's own IPv6-aware helper: a raw `request.ip`
// would give every address inside a client's /64 its own bucket, which is not
// a limit at all.
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";

const MINUTE = 60 * 1000;

// Keep the 429 body shaped like every other API error so the frontend's
// ApiError surfaces a usable message instead of express-rate-limit's plain text.
const jsonMessage = (message: string): Partial<Options> => ({
  message: { message },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// Chat is the only endpoint that costs real money per request (Anthropic
// tokens), so it gets the tightest budget of the three.
//
// Keyed by account, not address — see the note in chat.routes.ts. The router
// mounts `authenticate` ahead of this, so `userId` is always set by the time
// the key is read; the IP fallback exists only so a future remount in the
// wrong order degrades to the old behaviour instead of collapsing every
// caller into one shared bucket under the key `undefined`.
export const chatLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 30,
  keyGenerator: (request) => request.userId ?? ipKeyGenerator(request.ip ?? ""),
  ...jsonMessage("Too many chat requests. Please wait a few minutes and try again."),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  ...jsonMessage("Too many login attempts. Please wait a few minutes and try again."),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * MINUTE,
  limit: 5,
  ...jsonMessage("Too many accounts created from this address. Please try again later."),
});
