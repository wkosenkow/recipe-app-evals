import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

const TOAST_DURATION = 2600;

interface Toast {
  id: number;
  message: string;
}

interface ToastContextValue {
  /** Shows a short confirmation. Repeated calls stack, oldest at the bottom. */
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // A counter rather than Date.now(): two toasts raised in the same
  // millisecond would collide on a timestamp and share a React key.
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), TOAST_DURATION);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top, not bottom: every screen here keeps its controls along the
          bottom edge — the footer, and on a recipe the Recipe / Cook with AI
          pair — and a confirmation that lands on the primary action reads as
          a misplaced dialog. The top of these screens is passive content (a
          hero image, the message list), so covering a strip of it for two
          seconds costs nothing. Clears the header's own height on the screens
          that have one. pointer-events-none so the strip never swallows a
          click meant for what's underneath. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-24 z-50 flex flex-col items-center gap-2 px-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="max-w-full rounded-md bg-surface px-4 py-3 text-sm text-text shadow-md ring-1 ring-neutral-800 ring-inset animate-[toast-in_150ms_ease-out]"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
