import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "../modules/auth/auth.utils.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticate = (request: Request, response: Response, next: NextFunction): void => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
};
