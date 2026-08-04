"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    if (initialUser === null) refresh();
  }, []);

  useEffect(() => {
    loadOneSignal();
  }, []);

  useEffect(() => {
    if (user) {
      oneSignalLogin(user.id);
    } else {
      oneSignalLogout();
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
