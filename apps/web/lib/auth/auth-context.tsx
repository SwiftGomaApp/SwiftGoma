"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  logout as logoutRequest,
  logoutAll as logoutAllRequest,
  type AuthUser,
} from "@/lib/api/routes/auth.routes";
import {
  isApiError,
  isNetworkError,
  refreshAuthSession,
} from "@/lib/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  isLoggingOut: boolean;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  serverUnreachable: boolean;
}

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
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      setServerUnreachable(false);
      return me;
    } catch (error) {
      if (isNetworkError(error)) {
        setServerUnreachable(true);
        return null;
      }

      setServerUnreachable(false);

      if (!isApiError(error) || error.response?.status !== 401) {
        console.error("Failed to load current user", error);
      }
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUser !== null) return;
    refresh();
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      setUser((current) => {
        if (current !== null) setSessionExpired(true);
        return null;
      });
    }
    window.addEventListener("swg:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("swg:session-expired", handleSessionExpired);
  }, []);

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

  useEffect(() => {
    if (!serverUnreachable) return;

    let cancelled = false;
    let attempt = 0;

    function scheduleRetry() {
      const delay = Math.min(3000 * 2 ** attempt, 30000);
      attempt += 1;
      timeoutId = setTimeout(async () => {
        if (cancelled) return;
        await refresh();
        if (!cancelled) scheduleRetry();
      }, delay);
    }

    let timeoutId = setTimeout(() => {}, 0);
    clearTimeout(timeoutId);
    scheduleRetry();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [serverUnreachable, refresh]);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setSessionExpired(false);
      setIsLoggingOut(false);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logoutAllRequest();
    } finally {
      setUser(null);
      setSessionExpired(false);
      setIsLoggingOut(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      refresh,
      setUser,
      logout,
      logoutAll,
      isLoggingOut,
      sessionExpired,
      dismissSessionExpired,
      serverUnreachable,
    }),
    [
      user,
      isLoading,
      refresh,
      logout,
      logoutAll,
      isLoggingOut,
      sessionExpired,
      dismissSessionExpired,
      serverUnreachable,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
