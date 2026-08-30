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
  addCartItem,
  clearShopCart as clearShopCartRequest,
  getMyCarts,
  removeCartItem as removeCartItemRequest,
  updateCartItemQuantity as updateCartItemQuantityRequest,
  type ShopCart,
} from "@/lib/api/routes/cart.routes";
import { getClientLocale } from "@/lib/language";
import { toast } from "@/components/ui/toast";

const STRINGS = {
  en: {
    signInTitle: "Sign in required",
    signInDescription: "Sign in to add items to your cart.",
    signInButton: "Sign in",
    cancelButton: "Cancel",
    addedTitle: "Added to cart",
    addErrorTitle: "Couldn't add item to cart",
    updateErrorTitle: "Couldn't update your cart",
    genericError: "Something went wrong. Please try again.",
  },
  fr: {
    signInTitle: "Connexion requise",
    signInDescription: "Connectez-vous pour ajouter des articles à votre panier.",
    signInButton: "Se connecter",
    cancelButton: "Annuler",
    addedTitle: "Ajouté au panier",
    addErrorTitle: "Impossible d'ajouter l'article au panier",
    updateErrorTitle: "Impossible de mettre à jour votre panier",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
  },
} as const;

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

interface CartContextValue {
  carts: ShopCart[];
  totalCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (
    shopId: string,
    variantId: string,
    quantity?: number,
    productName?: string,
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearShopCart: (shopId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { requireLogin } = useLoginRequired();
  const [carts, setCarts] = useState<ShopCart[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCarts([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await getMyCarts();
      setCarts(result);
    } catch {
      // keep whatever was last successfully loaded
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (
      shopId: string,
      variantId: string,
      quantity = 1,
      productName?: string,
    ) => {
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

      try {
        await addCartItem(shopId, variantId, quantity);
        await refresh();
        toast.add({
          title: t.addedTitle,
          description: productName,
          type: "success",
        });
        return true;
      } catch (err) {
        toast.add({
          title: t.addErrorTitle,
          description: extractErrorMessage(err, t.genericError),
          type: "error",
        });
        return false;
      }
    },
    [isAuthenticated, refresh, requireLogin],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const t = STRINGS[getClientLocale()];
      try {
        if (quantity <= 0) {
          await removeCartItemRequest(itemId);
        } else {
          await updateCartItemQuantityRequest(itemId, quantity);
        }
        await refresh();
      } catch (err) {
        toast.add({
          title: t.updateErrorTitle,
          description: extractErrorMessage(err, t.genericError),
          type: "error",
        });
      }
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const t = STRINGS[getClientLocale()];
      try {
        await removeCartItemRequest(itemId);
        await refresh();
      } catch (err) {
        toast.add({
          title: t.updateErrorTitle,
          description: extractErrorMessage(err, t.genericError),
          type: "error",
        });
      }
    },
    [refresh],
  );

  const clearShopCart = useCallback(
    async (shopId: string) => {
      await clearShopCartRequest(shopId);
      await refresh();
    },
    [refresh],
  );

  const totalCount = useMemo(
    () =>
      carts.reduce(
        (sum, cart) =>
          sum + cart.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      ),
    [carts],
  );

  const value = useMemo(
    () => ({
      carts,
      totalCount,
      isLoading,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      clearShopCart,
    }),
    [
      carts,
      totalCount,
      isLoading,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      clearShopCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
