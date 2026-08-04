"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "@/lib/toast";
import { favoritesApi } from "@/lib/api/routes/favorites";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { LoginRequiredModal } from "@/components/cart/login-required-modal";

type FavoritesContextValue = {
  isFavorited: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!currentUserId) {
      setFavoriteIds(new Set());
      return;
    }
    favoritesApi
      .listIds()
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => {
        // offline or unreachable — hearts just start unfilled
      });
  }, [currentUserId]);

  const isFavorited = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  function toggleFavorite(productId: string) {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    const wasFavorited = favoriteIds.has(productId);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(productId);
      else next.add(productId);
      return next;
    });

    const request = wasFavorited
      ? favoritesApi.remove(productId)
      : favoritesApi.add(productId);

    request.catch((err) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    });
  }

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite }}>
      {children}
      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        message="Vous devez avoir un compte pour ajouter des produits à vos favoris."
      />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
