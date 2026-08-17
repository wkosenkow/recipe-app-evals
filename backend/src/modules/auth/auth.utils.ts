import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions, Response } from "express";

import { env } from "../../config/env.js";

export interface JwtPayload {
  sub: string;
}

export const AUTH_COOKIE_NAME = "auth-token";

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

export const signToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });

export const verifyToken = (token: string): JwtPayload => jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const toPublicUser = (user: { _id: unknown; email: string }) => ({
  id: String(user._id),
  email: user.email,
});

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  // Lax rather than strict: the app has no cross-site entry flow that needs the
  // cookie on a top-level navigation, and it still blocks the cookie on
  // cross-site subresource requests. Local dev works either way — :5173 and
  // :3000 are same-site, since SameSite ignores the port.
  sameSite: "lax",
  // Over plain http (local dev) a secure cookie would simply never be stored.
  secure: env.NODE_ENV === "production",
  path: "/",
};

// Deriving the cookie's lifetime from the token's own exp claim rather than
// re-parsing JWT_EXPIRES_IN keeps the two from ever drifting apart: a cookie
// outliving its token would leave the UI logged in against 401s, and a token
// outliving its cookie would log people out early.
export const setAuthCookie = (response: Response, token: string): void => {
  const decoded = jwt.decode(token);
  const expSeconds = typeof decoded === "object" && decoded !== null ? decoded.exp : undefined;

  response.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions,
    ...(expSeconds ? { expires: new Date(expSeconds * 1000) } : {}),
  });
};

// clearCookie only matches a cookie whose attributes line up with the ones it
// was set with, so this has to mirror baseCookieOptions.
export const clearAuthCookie = (response: Response): void => {
  response.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions);
};
