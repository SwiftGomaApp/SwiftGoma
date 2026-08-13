"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authApi, type User } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import {
  loadOneSignal,
  oneSignalLogin,
  oneSignalLogout,
} from "@/lib/onesignal";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  /** Pass from the server when the session is already resolved to skip a client /auth/me call. */
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(initialUser === undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hadOneSignalSessionRef = useRef(Boolean(initialUser));

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiException && err.isAuthError) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on mount when no server-provided user
    if (initialUser === undefined) refresh();
  }, []);

  useEffect(() => {
    loadOneSignal();
  }, []);

  useEffect(() => {
    if (user) {
      hadOneSignalSessionRef.current = true;
      void oneSignalLogin(user.id);
      return;
    }

    if (hadOneSignalSessionRef.current) {
      hadOneSignalSessionRef.current = false;
      void oneSignalLogout();
    }
  }, [user]);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsLoggingOut(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isLoggingOut, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
