import type { ErrorRequestHandler } from "express";

const DUPLICATE_KEY_CODE = 11000;

// MongoServerError is not a Mongoose error subclass, so there is no useful
// instanceof to check — the numeric code is the identifying feature. keyPattern
// names the fields of the index that was violated.
interface DuplicateKeyError {
  code: number;
  keyPattern?: Record<string, unknown>;
}

const asDuplicateKeyError = (error: unknown): DuplicateKeyError | null => {
  if (typeof error !== "object" || error === null) return null;

  const candidate = error as { code?: unknown; keyPattern?: Record<string, unknown> };
  if (candidate.code !== DUPLICATE_KEY_CODE) return null;

  return { code: DUPLICATE_KEY_CODE, keyPattern: candidate.keyPattern };
};

// Phrased per field where we can, so the message matches what the controller's
// own up-front check would have said. A user who double-clicks Sign up should
// get the same explanation whether their request lost the race or not.
const duplicateKeyMessage = (keyPattern?: Record<string, unknown>): string => {
  if (keyPattern && "email" in keyPattern) {
    return "An account with this email already exists";
  }

  return "That record already exists";
};

// Errors raised by Express-ecosystem middleware carry their own HTTP status —
// express.json() rejects a malformed body with 400 and an oversized one with
// 413. Those are client mistakes, so reporting them as 500 both misleads the
// caller and buries a real 500 in noise. The status is honoured but the message
// is ours: body-parser's text quotes the offending input, which we would rather
// not reflect back.
const clientErrorStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) return null;

  const candidate = error as { status?: unknown; statusCode?: unknown };
  const status = typeof candidate.status === "number" ? candidate.status : candidate.statusCode;

  if (typeof status !== "number" || status < 400 || status >= 500) return null;

  return status;
};

const clientErrorMessage = (error: unknown, status: number): string => {
  const type = (error as { type?: unknown }).type;

  if (type === "entity.parse.failed") return "Malformed JSON in the request body";
  if (type === "entity.too.large") return "Request body is too large";

  return status === 400 ? "Bad request" : "Request could not be processed";
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  console.error(error);

  // Once a response has started streaming — sendFile in the SPA fallback, say —
  // the status can no longer be set, and trying would throw over the original
  // error. Express's built-in handler destroys the socket in this case.
  if (response.headersSent) {
    next(error);
    return;
  }

  const duplicate = asDuplicateKeyError(error);

  if (duplicate) {
    response.status(409).json({ message: duplicateKeyMessage(duplicate.keyPattern) });
    return;
  }

  const clientStatus = clientErrorStatus(error);

  if (clientStatus) {
    response.status(clientStatus).json({ message: clientErrorMessage(error, clientStatus) });
    return;
  }

  response.status(500).json({
    message: "An unexpected server error occurred.",
  });
};
