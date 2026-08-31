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

import { useAuth } from "@/lib/auth/auth-context";
import { useLoginRequired } from "@/lib/auth/login-required-context";
import { isApiError } from "@/lib/api/client";
import {
  addFavorite,
  getFavoriteIds,
  removeFavorite,
} from "@/lib/api/routes/favorites.routes";
import { getClientLocale } from "@/lib/language";
import { toast } from "@/components/ui/toast";

const STRINGS = {
  en: {
    signInTitle: "Sign in required",
    signInDescription: "Sign in to save products to your favorites.",
    signInButton: "Sign in",
    cancelButton: "Cancel",
    errorTitle: "Couldn't update favorites",
    genericError: "Something went wrong. Please try again.",
  },
  fr: {
    signInTitle: "Connexion requise",
    signInDescription:
      "Connectez-vous pour enregistrer des produits en favoris.",
    signInButton: "Se connecter",
    cancelButton: "Annuler",
    errorTitle: "Impossible de mettre à jour les favoris",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
  },
} as const;

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

interface FavoritesContextValue {
  favoritesIds: Set<string>;
  isLoading: boolean;
  isFavorited: (productId: string) => boolean;
  toggle: (productId: string, productName?: string) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { requireLogin } = useLoginRequired();
  const [favoritesIds, setFavoritesIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoritesIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const ids = await getFavoriteIds();
      setFavoritesIds(new Set(ids));
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string, productName?: string) => {
      const t = STRINGS[getClientLocale()];

      if (!isAuthenticated) {
        requireLogin({
          title: t.signInTitle,
          description: t.signInDescription,
          signInLabel: t.signInButton,
          cancelLabel: t.cancelButton,
        });
        return false;
      }

      const wasFavorited = favoritesIds.has(productId);

      setFavoritesIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasFavorited) await removeFavorite(productId);
        else await addFavorite(productId);
        return true;
      } catch (err) {
        setFavoritesIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(productId);
          else next.delete(productId);
          return next;
        });
        toast.add({
          title: t.errorTitle,
          description: extractErrorMessage(err, t.genericError),
          type: "error",
        });
        return false;
      }
    },
    [favoritesIds, isAuthenticated, requireLogin],
  );

  const isFavorited = useCallback(
    (productId: string) => favoritesIds.has(productId),
    [favoritesIds],
  );

  const value = useMemo(
    () => ({ favoritesIds, isLoading, isFavorited, toggle }),
    [favoritesIds, isLoading, isFavorited, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
