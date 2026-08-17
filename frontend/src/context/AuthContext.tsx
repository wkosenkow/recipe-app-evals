import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ApiError, apiGet, apiPost } from "../lib/api";
import { useLocalStorage } from "../lib/use-local-storage";
import type { AuthUser } from "../types/user";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // The session itself is an httpOnly cookie we cannot read, so this cached user
  // is only a rendering hint: it lets the UI come up in its previous state
  // instead of flashing the guest view on every reload while /api/auth/me is in
  // flight. It grants nothing on its own — the server never trusts it, and the
  // check below discards it the moment the real session turns out to be gone.
  const [user, setUser] = useLocalStorage<AuthUser | null>("auth-user", null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ user: AuthUser }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      register: async (email, password) => {
        const data = await apiPost<{ user: AuthUser }>("/api/auth/register", { email, password });
        setUser(data.user);
      },
      login: async (email, password) => {
        const data = await apiPost<{ user: AuthUser }>("/api/auth/login", { email, password });
        setUser(data.user);
      },
      logout: async () => {
        // Only the server can clear an httpOnly cookie, so logging out is now a
        // request rather than a local state change. Drop the local user either
        // way: if the call failed, the session was already unusable.
        try {
          await apiPost("/api/auth/logout", {});
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
