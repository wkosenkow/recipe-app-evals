import path from "node:path";
import { fileURLToPath } from "node:url";

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
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());
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
