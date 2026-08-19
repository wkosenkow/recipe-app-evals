import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";

import { ChatStreamError, MAX_TURN_LENGTH, streamChatMessage, type ChatMessage, type ChatRecipe } from "../lib/chat";
import { getCookingSession, saveCookingSession } from "../lib/cooking-session";
import type { KitchenProfile } from "../types/kitchen";

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
// 16px, up from 13px. This is the walkthrough a cook reads mid-task, at more
// than arm's length, and it was the app's smallest body text while being its
// longest.
const USER_BUBBLE =
  "max-w-[85%] rounded-md bg-accent-900 px-4 py-3 text-base leading-[1.6] whitespace-pre-wrap text-text ring-1 ring-inset ring-accent-700";
const ASSISTANT_TEXT = "text-base leading-[1.6] text-text";

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
  // runs past 9 steps. At pl-5 a two-digit marker clipped its leading digit
  // against the scroll container's edge (overflow-y-auto computes overflow-x
  // to auto too, which clips at 0 rather than letting the marker bleed left).
  // pl-8 is 22.4px with a mouse and 32px under touch, against roughly 18px
  // for "17." at the 16px body size — margin to spare in both. A bulleted
  // list's single-glyph marker doesn't need it.
  //
  // Each step also gets a card of its own: a walkthrough is a sequence a cook
  // works through with their eyes leaving the screen between steps, and as one
  // continuous column the current step was indistinguishable from the previous
  // six at a glance. Surface fill and a gap give each one an edge to find
  // again; the marker takes the accent so the number is what the eye lands on.
  ol: ({ node: _node, ...props }) => (
    <ol
      className="mb-3 flex list-decimal flex-col gap-2 pl-8 last:mb-0 [&>li]:rounded-md [&>li]:bg-surface [&>li]:px-4 [&>li]:py-3 [&>li]:marker:font-semibold [&>li]:marker:text-accent"
      {...props}
    />
  ),
  li: ({ node: _node, ...props }) => <li className="pl-1" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-text" {...props} />,
  // Sized against the 16px body below, not the old 13px — at the previous
  // 14px these headings would now be *smaller* than the text they head.
  h1: ({ node: _node, ...props }) => (
    <p className="mt-4 mb-2 font-heading text-[19px] font-semibold text-text first:mt-0" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <p className="mt-4 mb-2 font-heading text-[18px] font-semibold text-text first:mt-0" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <p className="mt-3 mb-2 font-heading text-[17px] font-semibold text-text first:mt-0" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="rounded-sm bg-neutral-900 px-1 py-0.5 font-mono text-[14px] text-text" {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre className="mb-3 overflow-x-auto rounded-md bg-neutral-900 p-3 text-[14px] last:mb-0" {...props} />
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
  mealId: string;
}

function ChatView({ recipe, kitchenProfile, mealId }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  // Whether the reader is sitting at the bottom of the transcript. Auto-scroll
  // is allowed only while this holds, so scrolling up to re-read an earlier
  // step is not undone by the next token.
  const [pinned, setPinned] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Distinguishes an abort the cook asked for from one caused by unmounting or
  // by a newer request superseding this one — the three want different
  // outcomes and `signal.aborted` alone can't tell them apart.
  const stoppedRef = useRef(false);

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

    // Mirrors what `streamingText` accumulates. An abort rejects out of
    // `streamChatMessage` as a DOMException rather than a ChatStreamError, so
    // its `partial` is unavailable — but a deliberate Stop still needs to keep
    // what arrived, and reading it back out of state inside the catch would
    // mean a stale closure or a setState-with-side-effects.
    let received = "";

    try {
      const reply = await streamChatMessage(
        { recipe, kitchenProfile, ...turn },
        {
          // Deltas already in flight when we cancelled must not land: the
          // buffer now belongs to a newer request, and appending to it would
          // splice the abandoned reply into the new one.
          onDelta: (text) => {
            if (controller.signal.aborted) return;
            received += text;
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
      if (controller.signal.aborted) {
        // A deliberate Stop, not a teardown. What arrived is genuinely what
        // the model said — a cook who stopped at "sear both sides" already
        // has something to act on — so it's kept as a normal turn. No error
        // is shown: the cook caused this and knows it.
        if (stoppedRef.current) {
          stoppedRef.current = false;
          const partial = received.trim();
          // Nothing arrived: leave their question in the transcript rather
          // than rolling it back into the input, which after a deliberate
          // Stop would read as the app losing the message.
          if (partial) setMessages((prev) => [...prev, { role: "assistant", text: partial }]);
          setStreamingText("");
          setLoading(false);
        }
        // Otherwise the view is going away or a newer request replaced this
        // one. Touching state would resurrect a reply the user has moved on
        // from.
        return;
      }

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

  // Resume a saved conversation instead of firing the opening walkthrough
  // again — `cancelled` guards against React StrictMode's dev-only double
  // mount firing this twice (the second run's cleanup sets it before the
  // first run's request can resolve), the same pattern RecipeDetail already
  // uses for its own fetch-on-mount.
  useEffect(() => {
    let cancelled = false;

    getCookingSession(mealId)
      .then((saved) => {
        if (cancelled) return;
        if (saved.length > 0) {
          setMessages(saved);
        } else {
          requestOpening();
        }
      })
      .catch(() => {
        // A session that failed to load is not a chat failure — fall back to
        // the normal opening walkthrough rather than surfacing an error for a
        // feature the cook doesn't know exists yet.
        if (!cancelled) requestOpening();
      });

    // Stop generating when the cook closes the recipe: an unread reply is
    // billed all the same.
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Best-effort persistence after every turn — including a rolled-back one,
  // which still accurately reflects what the cook would see if they came
  // back. A failed save has no visible effect on the chat itself, so it's
  // not surfaced as an error; skipped entirely before the first reply lands,
  // since an empty array here just means "still loading", not "clear it".
  useEffect(() => {
    if (messages.length === 0) return;
    void saveCookingSession(mealId, messages).catch(() => {});
  }, [messages, mealId]);

  // Within this many pixels of the bottom still counts as "reading the latest"
  // — sub-pixel rounding and the odd trailing margin mean an exact comparison
  // would drop out of pinned state on its own.
  const PIN_THRESHOLD = 48;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < PIN_THRESHOLD);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setPinned(true);
  };

  // The container is scrolled directly rather than through
  // `bottomRef.scrollIntoView`: that walks up the ancestor chain and can move
  // the page as well as this pane, and its smooth animations queue up and
  // fight each other when a delta lands every few milliseconds.
  useEffect(() => {
    if (!pinned) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, loading, error, pinned]);

  // Grows the box with the message. Reset to "auto" first so a deleted line
  // shrinks the box back down — scrollHeight only ever reports how tall the
  // content currently needs, never how tall it needed to be a keystroke ago.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

  const stop = () => {
    stoppedRef.current = true;
    abortRef.current?.abort();
  };

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
      <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Announced politely, so a screen reader hears each finished turn. The
          text still streaming in below is deliberately excluded — announcing
          it would re-read the reply on every delta as it types itself out. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-4 overflow-y-auto pb-1"
        aria-live="polite"
      >
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

        {loading && !streamingText && <div className="text-base text-neutral-500">Thinking…</div>}

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
      </div>

        {/* Only while the reader has scrolled away. It replaces the yank back
            down that used to happen on its own, so catching up stays the
            reader's decision. */}
        {!pinned && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="btn btn-secondary absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-surface px-4 shadow-md"
          >
            ↓ Jump to latest
          </button>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 border-t border-neutral-800 pt-4">
        {/* items-end: as the textarea grows past one line, Send should stay
            pinned to its bottom edge — the default stretch would pull it tall
            and thin along with the box instead. */}
        <div className="flex items-end gap-3">
          {/* "send" labels the Enter key for what it actually does here. No
              autocapitalise/autocorrect overrides: unlike the search box, this
              is ordinary prose to a model that reads it as prose. */}
          <textarea
            ref={textareaRef}
            className="input min-h-[36px] max-h-[140px] flex-1 resize-none overflow-y-auto"
            rows={1}
            enterKeyHint="send"
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
          {/* Becomes Stop while a reply is streaming, rather than sitting there
              disabled. A walkthrough runs to 350 words and the cook often has
              what they need by step three — waiting out the rest, unable to
              ask the next thing, was the only option before. The abort
              machinery already existed for unmount; this just gives it a
              button.

              shrink-0: the textarea takes `flex-1`, and without this the
              button is the flex item that gives way — it collapses to about
              36px and the label spills past its own border. */}
          {loading ? (
            <button type="button" onClick={stop} className="btn btn-secondary shrink-0">
              Stop
            </button>
          ) : (
            <button type="button" onClick={() => send(input)} className="btn btn-primary shrink-0">
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatView;
