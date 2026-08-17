import type { Request, Response } from "express";

import { loginBodySchema, registerBodySchema } from "./auth.schemas.js";
import {
  clearAuthCookie,
  comparePassword,
  hashPassword,
  setAuthCookie,
  signToken,
  toPublicUser,
} from "./auth.utils.js";
import { User } from "./user.model.js";

export const register = async (request: Request, response: Response): Promise<void> => {
  const validation = registerBodySchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const email = validation.data.email.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    response.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(validation.data.password);
  const user = await User.create({ email, passwordHash });

  // The token deliberately isn't in the response body — putting it there would
  // hand it back to JS and undo the point of an httpOnly cookie.
  setAuthCookie(response, signToken(String(user._id)));

  response.status(201).json({ user: toPublicUser(user) });
};

export const login = async (request: Request, response: Response): Promise<void> => {
  const validation = loginBodySchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const email = validation.data.email.toLowerCase();
  const user = await User.findOne({ email });
  const valid = user ? await comparePassword(validation.data.password, user.passwordHash) : false;

  if (!user || !valid) {
    response.status(401).json({ message: "Invalid email or password" });
    return;
  }

  setAuthCookie(response, signToken(String(user._id)));

  response.status(200).json({ user: toPublicUser(user) });
};

export const logout = (_request: Request, response: Response): void => {
  clearAuthCookie(response);
  response.status(204).send();
};

export const me = async (request: Request, response: Response): Promise<void> => {
  const user = await User.findById(request.userId);

  // The token is valid but its user is gone (deleted account). Clear the cookie
  // so the client isn't left holding a session it can never use, and answer 401
  // rather than 404 — from the caller's side this is a dead session, and the
  // frontend already tears down state on 401.
  if (!user) {
    clearAuthCookie(response);
    response.status(401).json({ message: "Session no longer valid" });
    return;
  }

  response.status(200).json({ user: toPublicUser(user) });
};
