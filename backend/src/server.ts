import mongoose from "mongoose";

import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

// How long a shutdown waits for work already in flight before giving up on it.
//
// This matters more here than in a typical API because `/api/chat` holds an SSE
// connection open for the length of a model's reply. `server.close()` stops
// accepting new connections but waits for open ones to end, so without a
// deadline a single cook mid-walkthrough would hold the process open
// indefinitely. Render sends SIGKILL 30s after SIGTERM, so this stays well
// inside that: finish what can be finished, then go.
const SHUTDOWN_GRACE_MS = 15_000;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  let shuttingDown = false;

  const shutdown = (signal: string): void => {
    // Render can send a second signal, and a container being drained may get
    // SIGINT and SIGTERM both. Running this twice would close the server out
    // from under its own callback.
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received — draining connections`);

    const forceExit = setTimeout(() => {
      console.warn(`Still draining after ${SHUTDOWN_GRACE_MS}ms — exiting anyway`);
      process.exit(1);
    }, SHUTDOWN_GRACE_MS);
    // Don't let the deadline itself keep the process alive once everything
    // else has finished.
    forceExit.unref();

    server.close(() => {
      void mongoose.connection.close().then(
        () => {
          clearTimeout(forceExit);
          console.log("Closed cleanly");
          process.exit(0);
        },
        (error: unknown) => {
          console.error("Failed to close the database connection", error);
          process.exit(1);
        },
      );
    });
  };

  // Without these, a redeploy killed the process outright: any reply still
  // streaming was cut mid-sentence, and the client saw a connection that ended
  // without its terminating frame — which it correctly reports as a broken
  // reply, but which was avoidable.
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error: unknown) => {
  console.error("Failed to start the API", error);
  process.exit(1);
});
