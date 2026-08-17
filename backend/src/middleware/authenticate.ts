import type { NextFunction, Request, Response } from "express";

import { AUTH_COOKIE_NAME, verifyToken } from "../modules/auth/auth.utils.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticate = (request: Request, response: Response, next: NextFunction): void => {
  const token = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    response.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const payload = verifyToken(token);
    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired session" });
  }
};
