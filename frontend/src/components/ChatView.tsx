import { useEffect, useRef, useState } from "react";

import { sendChatMessage, type ChatMessage, type ChatRecipe } from "../lib/chat";
import type { RecipeEnrichment } from "../lib/recipe-enrichment";
import type { KitchenProfile } from "../types/kitchen";

const QUICK_PICKS = ["No dairy", "Fewer servings", "Different spices", "More detail, please"];

const FALLBACK_REPLY = "Sorry, I couldn't reach the assistant just now. Try again in a moment.";

interface ChatViewProps {
  recipe: ChatRecipe;
  enrichment?: RecipeEnrichment;
  kitchenProfile: KitchenProfile;
}

function ChatView({ recipe, enrichment, kitchenProfile }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    setLoading(true);
    sendChatMessage({ recipe, enrichment, kitchenProfile })
      .then((reply) => setMessages([{ role: "assistant", text: reply }]))
      .catch(() => setMessages([{ role: "assistant", text: FALLBACK_REPLY }]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    sendChatMessage({ recipe, enrichment, kitchenProfile, message: trimmed, history })
      .then((reply) => setMessages((prev) => [...prev, { role: "assistant", text: reply }]))
      .catch(() => setMessages((prev) => [...prev, { role: "assistant", text: FALLBACK_REPLY }]))
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
