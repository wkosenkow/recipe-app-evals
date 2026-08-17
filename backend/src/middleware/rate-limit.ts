import rateLimit, { type Options } from "express-rate-limit";

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
export const chatLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 30,
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
