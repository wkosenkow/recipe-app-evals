import path from "node:path";
import { fileURLToPath } from "node:url";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { chatRouter } from "./modules/chat/chat.routes.js";
import { cookingSessionRouter } from "./modules/cooking-session/cooking-session.routes.js";
import { favoriteRouter } from "./modules/favorites/favorite.routes.js";
import { kitchenProfileRouter } from "./modules/kitchen-profile/kitchen-profile.routes.js";

export const app = express();

// Render terminates TLS at its proxy, so without this every request would carry
// the proxy's IP and the per-IP rate limiters would collapse into one global
// bucket. Trust exactly one hop — trusting the whole chain would let a client
// spoof its own IP through X-Forwarded-For and slip past the limiters.
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "connect-src": ["'self'", "https://www.themealdb.com"],
        "img-src": ["'self'", "data:", "https://www.themealdb.com"],
      },
    },
  }),
);
// credentials is required for the auth cookie to travel at all cross-origin,
// which is the local-dev case (:5173 → :3000). In production the frontend is
// served from this same origin, so CORS never comes into play — but note that
// with credentials enabled, a wrong CLIENT_ORIGIN is no longer merely untidy:
// it would name an origin allowed to make credentialed calls. Hence the
// explicit CLIENT_ORIGIN in render.yaml rather than relying on the default.
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// "dev" is a colourised one-liner meant for a terminal someone is watching;
// it drops the client address, the referrer and the user agent, which are the
// fields you actually want when reading logs after the fact. "combined" is the
// Apache-style format log tooling expects.
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Answering "ok" while the database is unreachable makes this endpoint worse
// than useless: every route that matters needs Mongo, so a health check that
// ignores it reports a healthy service that cannot serve a single request.
// `readyState` is mongoose's own connection state — 1 is connected.
//
// 503 rather than 200-with-a-flag so an uptime monitor sees the outage without
// having to parse the body. Nothing currently depends on the status code:
// render.yaml sets no `healthCheckPath`, so this cannot bounce the service.
app.get("/api/health", (_request, response) => {
  const databaseUp = mongoose.connection.readyState === 1;

  response.status(databaseUp ? 200 : 503).json({
    status: databaseUp ? "ok" : "degraded",
    database: databaseUp ? "up" : "down",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/chat", chatRouter);
app.use("/api/kitchen-profile", kitchenProfileRouter);
app.use("/api/cooking-sessions", cookingSessionRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendDistPath));
app.get(/^\/(?!api\/).*/, (_request, response) => {
  response.sendFile(path.join(frontendDistPath, "index.html"));
});

app.use(errorHandler);
