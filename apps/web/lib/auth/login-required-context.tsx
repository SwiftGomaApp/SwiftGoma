"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  LoginRequiredDialog,
  type LoginRequiredContent,
} from "@/components/auth/login-required-dialog";

export type { LoginRequiredContent };

interface LoginRequiredContextValue {
  requireLogin: (content: LoginRequiredContent) => void;
}

const LoginRequiredContext = createContext<LoginRequiredContextValue | undefined>(
  undefined,
);

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<LoginRequiredContent | null>(null);

  const requireLogin = useCallback((next: LoginRequiredContent) => {
    setContent(next);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ requireLogin }), [requireLogin]);

  return (
    <LoginRequiredContext.Provider value={value}>
      {children}
      <LoginRequiredDialog open={open} onOpenChange={setOpen} content={content} />
    </LoginRequiredContext.Provider>
  );
}

export function useLoginRequired() {
  const ctx = useContext(LoginRequiredContext);
  if (!ctx) {
    throw new Error("useLoginRequired must be used within a LoginRequiredProvider");
  }
  return ctx;
}
