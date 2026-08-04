"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

type SearchTransitionContextValue = {
  isPending: boolean;
  navigate: (url: string) => void;
};

const SearchTransitionContext =
  createContext<SearchTransitionContextValue | null>(null);

export function SearchTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(url: string) {
    startTransition(() => {
      router.replace(url);
    });
  }

  return (
    <SearchTransitionContext.Provider value={{ isPending, navigate }}>
      {children}
    </SearchTransitionContext.Provider>
  );
}

export function useSearchTransition() {
  const ctx = useContext(SearchTransitionContext);
  if (!ctx) {
    throw new Error(
      "useSearchTransition must be used within a SearchTransitionProvider",
    );
  }
  return ctx;
}
