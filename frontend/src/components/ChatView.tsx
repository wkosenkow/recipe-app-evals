import { useEffect, useRef, useState } from "react";

import { sendChatMessage, type ChatMessage, type ChatRecipe } from "../lib/chat";
import type { RecipeEnrichment } from "../lib/recipe-enrichment";
import type { KitchenProfile } from "../types/kitchen";

const QUICK_PICKS = ["No dairy", "Fewer servings", "Different spices", "More detail, please"];

// Kept out of `messages` on purpose. Rendering a failure as an assistant turn
// would file it into the conversation and replay it to the model as something
// it actually said.
const ERROR_TEXT = "Couldn't reach the assistant just now.";

interface ChatViewProps {
  recipe: ChatRecipe;
  enrichment?: RecipeEnrichment;
  kitchenProfile: KitchenProfile;
}

function ChatView({ recipe, enrichment, kitchenProfile }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const requestOpening = () => {
    setLoading(true);
    setError(null);

    sendChatMessage({ recipe, enrichment, kitchenProfile })
      .then((reply) => setMessages([{ role: "assistant", text: reply }]))
      .catch(() => setError(ERROR_TEXT))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    requestOpening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, error]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    sendChatMessage({ recipe, enrichment, kitchenProfile, message: trimmed, history })
      .then((reply) => setMessages((prev) => [...prev, { role: "assistant", text: reply }]))
      .catch(() => {
        // Roll the conversation back to before the send and hand the text back
        // to the input. Leaving the user's turn in place would put a message
        // into the history that the assistant never answered, which then gets
        // replayed on the next request; this way retrying is just pressing Send
        // again.
        setMessages(history);
        setInput(trimmed);
        setError(ERROR_TEXT);
      })
      .finally(() => setLoading(false));
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
        {loading && (
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
              <span className="text-xs text-gray-500">Your message is back in the box — send it again.</span>
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
