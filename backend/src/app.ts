import path from "node:path";
import { fileURLToPath } from "node:url";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { chatRouter } from "./modules/chat/chat.routes.js";
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
app.use(morgan("dev"));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/chat", chatRouter);
app.use("/api/kitchen-profile", kitchenProfileRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendDistPath));
app.get(/^\/(?!api\/).*/, (_request, response) => {
  response.sendFile(path.join(frontendDistPath, "index.html"));
});

app.use(errorHandler);
