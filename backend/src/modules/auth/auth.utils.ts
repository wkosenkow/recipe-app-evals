import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";

export interface JwtPayload {
  sub: string;
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

export const signToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });

export const verifyToken = (token: string): JwtPayload => jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const toPublicUser = (user: { _id: unknown; email: string }) => ({
  id: String(user._id),
  email: user.email,
});
