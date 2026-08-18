import type { NextFunction, Request, Response } from "express";

import { chatRequestBodySchema } from "./chat.schemas.js";
import { buildChatMessages } from "./chat.prompt.js";
import { streamChatReply } from "./chat.service.js";

// A reply arrives as a run of `delta` frames closed by exactly one terminator.
// The terminator is the point of the protocol: without it a dropped connection
// is indistinguishable from a finished reply, and the client would file a
// truncated answer away as complete — then replay it to the model as something
// it actually said.
type ChatStreamFrame = { type: "delta"; text: string } | { type: "done" } | { type: "error" };

const writeFrame = (response: Response, frame: ChatStreamFrame): void => {
  response.write(`data: ${JSON.stringify(frame)}\n\n`);
};

export const sendChatMessage = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const validation = chatRequestBodySchema.safeParse(request.body);

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

  const messages = buildChatMessages(validation.data);
  const controller = new AbortController();

  let streamOpened = false;
  let finished = false;
  let clientGone = false;

  // Generating a reply costs money for as long as it runs, so stop the moment
  // there is nobody left to read it.
  //
  // This has to be the *response*, not the request. A request's "close" is
  // about the lifetime of the incoming stream, and express.json() has already
  // drained the body long before the reply starts — so listening there never
  // tells us the reader hung up. Measured: with the listener on the request,
  // a client that disconnected after 3 deltas left the model generating for
  // another 35 seconds.
  response.on("close", () => {
    if (finished) return;
    clientGone = true;
    controller.abort();
  });

  // Headers are held back until there is something to send. While they are
  // unsent the response can still be an ordinary JSON error with a status
  // code, which is far more useful than a 200 whose body turns out to contain
  // an error frame — so a provider that fails immediately (bad key, retired
  // model) is reported the way the rest of the API reports failures.
  const openStream = (): void => {
    if (streamOpened) return;
    response.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Ask any reverse proxy in front of us not to buffer the body. Without
      // it the proxy can hold the whole reply and hand it over in one piece,
      // undoing the streaming in transit.
      "X-Accel-Buffering": "no",
    });
    response.flushHeaders();
    streamOpened = true;
  };

  try {
    for await (const delta of streamChatReply(messages, controller.signal)) {
      openStream();
      writeFrame(response, { type: "delta", text: delta });
    }

    if (clientGone) return;

    // A model that returns nothing still gets a well-formed, terminated
    // stream; an empty reply is the client's to interpret.
    openStream();
    finished = true;
    writeFrame(response, { type: "done" });
    response.end();
  } catch (error) {
    // We cancelled this ourselves when the reader left. The two providers
    // throw different types for that (DOMException vs APIUserAbortError), so
    // the flag is the reliable signal, not the error's class.
    if (clientGone) return;

    if (!streamOpened) {
      next(error);
      return;
    }

    finished = true;
    writeFrame(response, { type: "error" });
    response.end();
  }
};
