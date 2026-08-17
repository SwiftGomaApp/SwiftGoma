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
import { refreshSession } from "@/lib/api/client";
import { clearCarts } from "@/lib/cart/storage";

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
        try {
          await refreshSession();
          const me = await authApi.getMe();
          setUser(me);
          return;
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
    const loggedOutUserId = user?.id ?? null;
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsLoggingOut(false);
      if (loggedOutUserId) clearCarts(loggedOutUserId);
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
