"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";
import { getMe, logout as logoutRequest } from "@/lib/api/routes/auth";
import { ApiError } from "@/lib/api/client";
import { AuthContextValue, AuthUser } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me as AuthUser);
      setConnectionError(false);
    } catch (err) {
      setUser(null);

      if (err instanceof ApiError) {
        setConnectionError(false);
        return;
      }

      if (axios.isAxiosError(err) && !err.response) {
        console.warn(
          "[auth] Couldn't reach the server to check the session:",
          err.message,
        );
        setConnectionError(true);
        return;
      }

      console.error("[auth] Unexpected error checking session:", err);
      setConnectionError(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await fetchUser();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUser]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error("[auth] Logout request failed:", err);
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        connectionError,
        refetchUser: fetchUser,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
