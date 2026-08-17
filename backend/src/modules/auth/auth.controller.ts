import type { Request, Response } from "express";

import { loginBodySchema, registerBodySchema } from "./auth.schemas.js";
import { comparePassword, hashPassword, signToken, toPublicUser } from "./auth.utils.js";
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
  const token = signToken(String(user._id));

  response.status(201).json({ token, user: toPublicUser(user) });
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

  const token = signToken(String(user._id));

  response.status(200).json({ token, user: toPublicUser(user) });
};

export const me = async (request: Request, response: Response): Promise<void> => {
  const user = await User.findById(request.userId);

  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  response.status(200).json({ user: toPublicUser(user) });
};
