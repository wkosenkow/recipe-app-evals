import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { apiGet, apiPut } from "../lib/api";
import type { KitchenProfile } from "../types/kitchen";

// Long enough to outlast the gap between keystrokes, short enough that the
// confirmation still feels tied to the edit that caused it.
const TOAST_DEBOUNCE = 700;

const DEFAULT_PROFILE: KitchenProfile = {
  servings: 4,
  units: "metric",
  skill: "novice",
  equipment: "",
  diet: "",
};

interface KitchenProfileContextValue {
  profile: KitchenProfile;
  loading: boolean;
  error: string | null;
  updateProfile: (patch: Partial<KitchenProfile>) => void;
}

const KitchenProfileContext = createContext<KitchenProfileContextValue | null>(null);

export function KitchenProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profile, setProfile] = useState<KitchenProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The newest profile that hasn't reached the server yet, and whether a PUT
  // is currently in flight. Together they serialise the writes.
  const queued = useRef<KitchenProfile | null>(null);
  const inFlight = useRef(false);
  const lastSaveOk = useRef(true);

  /**
   * Sends the queued profile, one request at a time.
   *
   * Firing a PUT per keystroke without this loses edits. Each one carries the
   * whole profile and the server writes it wholesale, so ten concurrent
   * requests for "dairy-free" are ten full documents racing each other — and
   * the one that happens to arrive last wins, not the one sent last. Typing
   * the word could leave "dairy-fr" stored, or "d". The screen still showed
   * the right text, because the local state is optimistic; the truth only
   * appeared on the next reload, which is exactly what makes it look like
   * "it didn't save".
   *
   * Serialising rather than debouncing keeps the first keystroke's save
   * immediate — nothing is sitting in a timer waiting to be lost if the tab
   * closes — while guaranteeing the last value written is the last value
   * typed.
   */
  const flushQueue = useCallback(() => {
    if (inFlight.current) return;

    const next = queued.current;
    if (!next) return;

    queued.current = null;
    inFlight.current = true;

    void apiPut<{ profile: KitchenProfile }>("/api/kitchen-profile", next)
      .then(
        () => {
          lastSaveOk.current = true;
        },
        (err: unknown) => {
          lastSaveOk.current = false;
          setError(err instanceof Error ? err.message : "Failed to save kitchen profile");
        },
      )
      .finally(() => {
        inFlight.current = false;
        // Keystrokes that landed while this request was out are still waiting.
        if (queued.current) flushQueue();
      });
  }, []);

  // A pending confirmation belongs to a screen the cook is still on. Without
  // this, editing the profile and immediately navigating away pops a toast
  // over whatever they opened next.
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGet<{ profile: KitchenProfile }>("/api/kitchen-profile")
      .then((data) => setProfile(data.profile))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load kitchen profile"))
      .finally(() => setLoading(false));
  }, [user]);

  const value = useMemo<KitchenProfileContextValue>(
    () => ({
      profile,
      loading,
      error,
      updateProfile: (patch) => {
        if (!user) return;

        const next = { ...profile, ...patch };
        setProfile(next);

        // Queue rather than send: `flushQueue` guarantees one request at a
        // time, so the last value typed is the last value written.
        queued.current = next;
        flushQueue();

        // The *confirmation* is collapsed even though the saves are not:
        // equipment and diet are free text and would otherwise toast once per
        // letter. The timer restarts on each call rather than on each save's
        // completion — hanging it off a response fires it while the cook is
        // still typing, which produced three overlapping toasts for one word.
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(function confirmWhenIdle() {
          // Wait for the queue to drain before claiming anything is saved,
          // and stay silent on failure — the error banner covers that.
          if (inFlight.current || queued.current) {
            toastTimer.current = setTimeout(confirmWhenIdle, 150);
            return;
          }
          if (lastSaveOk.current) showToast("Kitchen profile saved");
        }, TOAST_DEBOUNCE);
      },
    }),
    [profile, loading, error, user, showToast, flushQueue],
  );

  return <KitchenProfileContext.Provider value={value}>{children}</KitchenProfileContext.Provider>;
}

export function useKitchenProfile(): KitchenProfileContextValue {
  const ctx = useContext(KitchenProfileContext);
  if (!ctx) throw new Error("useKitchenProfile must be used within a KitchenProfileProvider");
  return ctx;
}
