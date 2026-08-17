import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useLocalStorage } from "../lib/use-local-storage";
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
  updateProfile: (patch: Partial<KitchenProfile>) => void;
}

const KitchenProfileContext = createContext<KitchenProfileContextValue | null>(null);

export function KitchenProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useLocalStorage<KitchenProfile>("kitchen-profile", DEFAULT_PROFILE);

  const value = useMemo<KitchenProfileContextValue>(
    () => ({
      profile,
      updateProfile: (patch) => setProfile((prev) => ({ ...prev, ...patch })),
    }),
    [profile, setProfile],
  );

  return <KitchenProfileContext.Provider value={value}>{children}</KitchenProfileContext.Provider>;
}

export function useKitchenProfile(): KitchenProfileContextValue {
  const ctx = useContext(KitchenProfileContext);
  if (!ctx) throw new Error("useKitchenProfile must be used within a KitchenProfileProvider");
  return ctx;
}
