import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";

import { ChatStreamError, MAX_TURN_LENGTH, streamChatMessage, type ChatMessage, type ChatRecipe } from "../lib/chat";
import type { KitchenProfile } from "../types/kitchen";

const QUICK_PICKS = ["No dairy", "Fewer servings", "Different spices", "More detail, please"];

// The compose box grows with the message instead of scrolling internally, up
// to this many pixels (about 6 lines at this text size) — past that a paste
// or a long aside scrolls within the box rather than pushing the message list
// off screen.
const MAX_TEXTAREA_HEIGHT = 140;

// Kept out of `messages` on purpose. Rendering a failure as an assistant turn
// would file it into the conversation and replay it to the model as something
// it actually said.
const ERROR_TEXT = "Couldn't reach the assistant just now.";
const TRUNCATED_TEXT = "The reply broke off partway.";

// Only the cook's own turns get a bubble — a short aside boxed off from the
// reply below it. The assistant's side is set as plain text in the shared
// pane instead, the way Claude's own chat reads: no card, no ring, just the
// reply flowing at the pane's full width. That also sidesteps the bubble
// version's real problem — a box sized to streamed content reflows its own
// width on every delta, so the reader watches the container jump as much as
// the text. Plain text just grows downward.
const USER_BUBBLE =
  "max-w-[85%] rounded-md bg-accent-900 px-4 py-3 text-[13px] leading-[1.6] whitespace-pre-wrap text-text ring-1 ring-inset ring-accent-700";
const ASSISTANT_TEXT = "text-[13px] leading-[1.6] text-text";

// The system prompt never asks for markdown, but the model reaches for it
// anyway — numbered steps, bulleted ingredients, an occasional "**Note:**" —
// because it's the natural way to write a recipe walkthrough. Without a
// renderer that showed up as literal asterisks at the start of every line.
//
// remark-breaks, not the CommonMark default: a bare "\n" would otherwise
// collapse to a single space (a "soft break"), and the model separates lines
// within a paragraph — not just list items — by a single newline rather than
// a blank line. Losing those would run sentences together.
//
// Headings render as weighted paragraphs, not literal <h1>-<h3>: the Cook
// with AI screen carries no page heading of its own, but a chat message
// nested in some other future screen should never be able to plant a second
// <h1> ahead of the page's real one.
const MARKDOWN_COMPONENTS: Components = {
  p: ({ node: _node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
  // pl-8, not ul's pl-5: an outside decimal marker needs room for its own
  // digits before the gap to the text, and a recipe walkthrough routinely
  // runs past 9 steps. Measured "17." at ~14.8px against 13px Inter — pl-5's
  // 14px left it clipping its own leading digit against the scroll
  // container's edge (overflow-y-auto computes overflow-x to auto too, which
  // clips at 0 rather than letting the marker bleed left). pl-8 leaves margin
  // to spare, and a bulleted list's single-glyph marker doesn't need it.
  ol: ({ node: _node, ...props }) => <ol className="mb-3 list-decimal space-y-1 pl-8 last:mb-0" {...props} />,
  li: ({ node: _node, ...props }) => <li className="pl-1" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-text" {...props} />,
  h1: ({ node: _node, ...props }) => (
    <p className="mt-4 mb-2 font-heading text-[14px] font-semibold text-text first:mt-0" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <p className="mt-4 mb-2 font-heading text-[14px] font-semibold text-text first:mt-0" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <p className="mt-3 mb-2 font-heading text-[13px] font-semibold text-text first:mt-0" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="rounded-sm bg-neutral-900 px-1 py-0.5 font-mono text-[12px] text-text" {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre className="mb-3 overflow-x-auto rounded-md bg-neutral-900 p-3 text-[12px] last:mb-0" {...props} />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="mb-3 border-l-2 border-neutral-700 pl-3 text-neutral-400 last:mb-0" {...props} />
  ),
};

// Shared by both a finished turn and the buffer still streaming in — the same
// text, rendered the same way, just at a different point in its life.
function ChatMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS}>
      {text}
    </ReactMarkdown>
  );
}

interface ChatViewProps {
  recipe: ChatRecipe;
  kitchenProfile: KitchenProfile;
}

function ChatView({ recipe, kitchenProfile }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        { recipe, kitchenProfile, ...turn },
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

  // Grows the box with the message. Reset to "auto" first so a deleted line
  // shrinks the box back down — scrollHeight only ever reports how tall the
  // content currently needs, never how tall it needed to be a keystroke ago.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Announced politely, so a screen reader hears each finished turn. The
          text still streaming in below is deliberately excluded — announcing
          it would re-read the reply on every delta as it types itself out. */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-1" aria-live="polite">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={index} className="flex justify-end">
              <div className={USER_BUBBLE}>{message.text}</div>
            </div>
          ) : (
            <div key={index} className={ASSISTANT_TEXT}>
              <ChatMarkdown text={message.text} />
            </div>
          ),
        )}

        {/* No trailing caret glyph here — it has nowhere sensible to sit once
            the text is a tree of parsed elements rather than one string, and
            the growing, self-reformatting text is already the same liveness
            cue Claude's own chat relies on. */}
        {streamingText && (
          <div className={ASSISTANT_TEXT} aria-hidden="true">
            <ChatMarkdown text={streamingText} />
          </div>
        )}

        {loading && !streamingText && <div className="text-[13px] text-neutral-500">Thinking…</div>}

        {error && (
          <div role="alert" className="flex flex-col items-center gap-1 py-2 text-center text-sm text-danger">
            <span>{error}</span>
            {messages.length === 0 ? (
              <button
                type="button"
                onClick={requestOpening}
                className="font-semibold text-accent-300 hover:text-accent-200"
              >
                Try again
              </button>
            ) : (
              <span className="text-xs text-neutral-500">
                {error === TRUNCATED_TEXT
                  ? "Ask for the rest and it will pick up from there."
                  : "Your message is back in the box — send it again."}
              </span>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 border-t border-neutral-800 pt-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_PICKS.map((pick) => (
            <button key={pick} type="button" onClick={() => send(pick)} disabled={loading} className="tag tag-outline">
              {pick}
            </button>
          ))}
        </div>
        {/* items-end: as the textarea grows past one line, Send should stay
            pinned to its bottom edge — the default stretch would pull it tall
            and thin along with the box instead. */}
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            className="input min-h-[36px] max-h-[140px] flex-1 resize-none overflow-y-auto"
            rows={1}
            maxLength={MAX_TURN_LENGTH}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              // isComposing: an IME (e.g. entering Japanese or Chinese) uses
              // Enter to confirm a candidate, not to submit — sending on that
              // keystroke would fire the message mid-composition.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder="e.g. no dairy, more servings…"
          />
          {/* shrink-0: the textarea takes `flex-1`, and without this the button
              is the flex item that gives way — it collapses to about 36px and
              the label spills past its own border. */}
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading}
            className="btn btn-primary shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatView;
