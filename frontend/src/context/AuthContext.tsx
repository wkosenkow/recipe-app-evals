import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ApiError, apiGet, apiPost, setAuthToken } from "../lib/api";
import { useLocalStorage } from "../lib/use-local-storage";
import type { AuthUser } from "../types/user";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useLocalStorage<string | null>("auth-token", null);
  const [user, setUser] = useLocalStorage<AuthUser | null>("auth-user", null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiGet<{ user: AuthUser }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          setToken(null);
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
        const data = await apiPost<{ token: string; user: AuthUser }>("/api/auth/register", { email, password });
        setToken(data.token);
        setUser(data.user);
      },
      login: async (email, password) => {
        const data = await apiPost<{ token: string; user: AuthUser }>("/api/auth/login", { email, password });
        setToken(data.token);
        setUser(data.user);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [user, loading, setToken, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
