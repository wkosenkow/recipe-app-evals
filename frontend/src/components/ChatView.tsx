import { useEffect, useRef, useState } from "react";

import { ChatStreamError, streamChatMessage, type ChatMessage, type ChatRecipe } from "../lib/chat";
import type { RecipeEnrichment } from "../lib/recipe-enrichment";
import type { KitchenProfile } from "../types/kitchen";

const QUICK_PICKS = ["No dairy", "Fewer servings", "Different spices", "More detail, please"];

// Kept out of `messages` on purpose. Rendering a failure as an assistant turn
// would file it into the conversation and replay it to the model as something
// it actually said.
const ERROR_TEXT = "Couldn't reach the assistant just now.";
const TRUNCATED_TEXT = "The reply broke off partway.";

interface ChatViewProps {
  recipe: ChatRecipe;
  enrichment?: RecipeEnrichment;
  kitchenProfile: KitchenProfile;
}

function ChatView({ recipe, enrichment, kitchenProfile }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runStream = async (
    turn: { message?: string; history?: ChatMessage[] },
    rollback: () => void,
  ): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setStreamingText("");

    try {
      const reply = await streamChatMessage(
        { recipe, enrichment, kitchenProfile, ...turn },
        {
          // Deltas already in flight when we cancelled must not land: the
          // buffer now belongs to a newer request, and appending to it would
          // splice the abandoned reply into the new one.
          onDelta: (text) => {
            if (controller.signal.aborted) return;
            setStreamingText((prev) => prev + text);
          },
          signal: controller.signal,
        },
      );
      // A reply that finished just as we cancelled it must still be dropped:
      // this request has been superseded, and appending it now would land a
      // stale answer after a newer one.
      if (controller.signal.aborted) return;

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      // We tore this down ourselves — either the view is going away or a newer
      // request replaced it. Touching state here would resurrect a reply the
      // user has already moved on from.
      if (controller.signal.aborted) return;

      const partial = err instanceof ChatStreamError ? err.partial.trim() : "";

      if (partial) {
        // Genuinely what the model said, just unfinished. Throwing it away
        // would discard steps the cook can already act on, so keep it and be
        // honest that it stops short.
        setMessages((prev) => [...prev, { role: "assistant", text: partial }]);
        setError(TRUNCATED_TEXT);
      } else {
        rollback();
        setError(ERROR_TEXT);
      }
    } finally {
      if (!controller.signal.aborted) {
        setStreamingText("");
        setLoading(false);
      }
    }
  };

  const requestOpening = () => {
    void runStream({}, () => {});
  };

  useEffect(() => {
    requestOpening();
    // Stop generating when the cook closes the recipe: an unread reply is
    // billed all the same.
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, loading, error]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    void runStream({ message: trimmed, history }, () => {
      // Roll the conversation back to before the send and hand the text back
      // to the input. Leaving the user's turn in place would put a message
      // into the history that the assistant never answered, which then gets
      // replayed on the next request; this way retrying is just pressing Send
      // again.
      setMessages(history);
      setInput(trimmed);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-1">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-md border px-3 py-2 text-sm leading-relaxed ${
                message.role === "user"
                  ? "border-blue-500/40 bg-blue-500/15 text-gray-100"
                  : "border-gray-700 bg-gray-900 text-gray-100"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm leading-relaxed text-gray-100">
              {streamingText}
              <span className="ml-0.5 inline-block animate-pulse text-gray-500">▍</span>
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-500">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-col items-center gap-1 py-2 text-center text-sm text-red-400">
            <span>{error}</span>
            {messages.length === 0 ? (
              <button type="button" onClick={requestOpening} className="font-semibold text-blue-400 hover:underline">
                Try again
              </button>
            ) : (
              <span className="text-xs text-gray-500">
                {error === TRUNCATED_TEXT
                  ? "Ask for the rest and it will pick up from there."
                  : "Your message is back in the box — send it again."}
              </span>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-gray-800 pt-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => send(pick)}
              disabled={loading}
              className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400 disabled:opacity-50"
            >
              {pick}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(input);
            }}
            placeholder="e.g. no dairy, more servings…"
            className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatView;
