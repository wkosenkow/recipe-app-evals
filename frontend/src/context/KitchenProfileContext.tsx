import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { apiGet, apiPut } from "../lib/api";
import type { KitchenProfile } from "../types/kitchen";

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
  const [profile, setProfile] = useState<KitchenProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        apiPut<{ profile: KitchenProfile }>("/api/kitchen-profile", next).catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Failed to save kitchen profile"),
        );
      },
    }),
    [profile, loading, error, user],
  );

  return <KitchenProfileContext.Provider value={value}>{children}</KitchenProfileContext.Provider>;
}

export function useKitchenProfile(): KitchenProfileContextValue {
  const ctx = useContext(KitchenProfileContext);
  if (!ctx) throw new Error("useKitchenProfile must be used within a KitchenProfileProvider");
  return ctx;
}
