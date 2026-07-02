"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getApiErrorCode } from "@/lib/api-client";
import { authApi, MeResponseData } from "@/lib/api/auth-api";

interface AuthContextValue {
  user: MeResponseData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<unknown>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => authApi.getMe().then((res) => res.data),
    retry: (failureCount, error) => {
      const code = getApiErrorCode(error);
      if (
        code === "UNAUTHORIZED" ||
        code === "TOKEN_EXPIRED" ||
        code === "SESSION_INVALID"
      ) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.clear();
      router.push("/auth/sign-in");
    }
  }, [queryClient, router]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.clear();
      router.push("/auth/sign-in");
    }
  }, [queryClient, router]);

  const value: AuthContextValue = {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    refetch,
    logout,
    logoutAll,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
