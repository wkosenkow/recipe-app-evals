import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  const latestSave = useRef<Promise<boolean> | null>(null);
  const [profile, setProfile] = useState<KitchenProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Resolves to whether the save worked, and never rejects — the timer
        // below is the only consumer, and an unobserved rejection here would
        // surface as an unhandled promise error whenever it's cleared.
        const saved = apiPut<{ profile: KitchenProfile }>("/api/kitchen-profile", next).then(
          () => true,
          (err: unknown) => {
            setError(err instanceof Error ? err.message : "Failed to save kitchen profile");
            return false;
          },
        );
        latestSave.current = saved;

        // The save itself stays per-keystroke — deferring it would risk losing
        // an edit if the cook navigates away mid-debounce — but the
        // *confirmation* is collapsed, since equipment and diet are free text
        // and would otherwise toast once per letter typed.
        //
        // The timer restarts on each *call*, not on each save's completion:
        // the requests are concurrent and settle out of order, so a timer
        // hung off an early response fires while the cook is still typing.
        // That produced three overlapping toasts for one word in testing.
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => {
          // Confirm against the most recent save rather than the one that
          // happened to start this timer, and stay silent if it failed —
          // the error banner already covers that case.
          void latestSave.current?.then((ok) => {
            if (ok) showToast("Kitchen profile saved");
          });
        }, TOAST_DEBOUNCE);
      },
    }),
    [profile, loading, error, user, showToast],
  );

  return <KitchenProfileContext.Provider value={value}>{children}</KitchenProfileContext.Provider>;
}

export function useKitchenProfile(): KitchenProfileContextValue {
  const ctx = useContext(KitchenProfileContext);
  if (!ctx) throw new Error("useKitchenProfile must be used within a KitchenProfileProvider");
  return ctx;
}
