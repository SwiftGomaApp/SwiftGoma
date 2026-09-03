"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getMe, logout as logoutRequest } from "@/lib/api/routes/auth";
import { ApiError, refreshAuthSession } from "@/lib/api/client";
import { AuthContextValue, AuthUser } from "@/types/auth";
import { getDashboardPath } from "@/lib/get-dashboard-path";

const ACCESS_TOKEN_TTL_MINUTES =
  Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_TTL_MINUTES) || 15;
const PROACTIVE_REFRESH_MARGIN_MINUTES = 3;
const PROACTIVE_REFRESH_DELAY_MS =
  Math.max(ACCESS_TOKEN_TTL_MINUTES - PROACTIVE_REFRESH_MARGIN_MINUTES, 1) *
  60 *
  1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  /** Pass from the server when the session is already resolved to skip a client /auth/me call. */
  initialUser?: AuthUser | null;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(initialUser === undefined);
  const [isCompletingLogin, setIsCompletingLogin] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const fetchUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await getMe();
      setUser(me as AuthUser);
      setConnectionError(false);
      return me as AuthUser;
    } catch (err) {
      setUser(null);

      if (err instanceof ApiError) {
        setConnectionError(false);
        return null;
      }

      if (axios.isAxiosError(err) && !err.response) {
        console.warn(
          "[auth] Couldn't reach the server to check the session:",
          err.message,
        );
        setConnectionError(true);
        return null;
      }

      console.error("[auth] Unexpected error checking session:", err);
      setConnectionError(false);
      return null;
    }
  }, []);

  useEffect(() => {
    if (initialUser !== undefined) return;

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await fetchUser();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUser, initialUser]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      timeoutId = setTimeout(async () => {
        if (cancelled) return;
        try {
          await refreshAuthSession();
        } catch {
          // A genuine failure still surfaces via the next request's reactive
          // 401 handling — nothing extra to do here.
        }
        if (!cancelled) scheduleNext();
      }, PROACTIVE_REFRESH_DELAY_MS);
    }

    scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user]);

  const completeLogin = useCallback(
    async (sessionUser?: AuthUser | null) => {
      setIsCompletingLogin(true);
      setConnectionError(false);

      try {
        const me = sessionUser ?? (await fetchUser());
        if (sessionUser) {
          setUser(sessionUser);
          setIsLoading(false);
        }
        router.replace(me ? getDashboardPath(me.role) : "/user");
      } catch {
        setIsCompletingLogin(false);
      }
    },
    [fetchUser, router],
  );

  useEffect(() => {
    if (isCompletingLogin && user && !isLoading) {
      setIsCompletingLogin(false);
    }
  }, [isCompletingLogin, user, isLoading]);

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
        isCompletingLogin,
        isAuthenticated: user !== null,
        connectionError,
        refetchUser: fetchUser,
        completeLogin,
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
