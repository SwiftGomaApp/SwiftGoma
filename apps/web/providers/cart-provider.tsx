"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "@/lib/toast";
import { cartApi, type Cart, type CartItem } from "@/lib/api/routes/cart";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { CartModal } from "@/components/cart/cart-modal";
import { CartShopPicker } from "@/components/cart/cart-shop-picker";
import { EmptyCartModal } from "@/components/cart/empty-cart-modal";
import { LoginRequiredModal } from "@/components/cart/login-required-modal";
import { loadCarts, saveCarts, type CartMap } from "@/lib/cart/storage";

const EMPTY_CART_MAP: CartMap = {};
const QUANTITY_SYNC_DELAY_MS = 400;

type CartContextValue = {
  totalItemCount: number;
  getCart: (shopId: string) => Cart | undefined;
  addToCart: (input: {
    shopId: string;
    variantId: string;
    quantity: number;
    variant: CartItem["variant"];
  }) => void;
  updateQuantity: (shopId: string, itemId: string, quantity: number) => void;
  removeItem: (shopId: string, itemId: string) => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function countItems(carts: CartMap) {
  return Object.values(carts).reduce(
    (sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
}

function withoutShop(carts: CartMap, shopId: string): CartMap {
  const next = { ...carts };
  delete next[shopId];
  return next;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [carts, setCarts] = useState<CartMap>(EMPTY_CART_MAP);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emptyModalOpen, setEmptyModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const quantityTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const quantityRollback = useRef<Record<string, Cart | undefined>>({});

  // Instant hydration from the local cache whenever the signed-in user changes.
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null>(
    null,
  );
  const currentUserId = user?.id ?? null;
  if (hydratedForUserId !== currentUserId) {
    setHydratedForUserId(currentUserId);
    setCarts(currentUserId ? loadCarts(currentUserId) : EMPTY_CART_MAP);
  }

  // Background reconcile with the server once the local cache is showing.
  useEffect(() => {
    if (!currentUserId) return;
    cartApi
      .getMyCarts()
      .then((serverCarts) => {
        const map: CartMap = {};
        for (const cart of serverCarts) map[cart.shopId] = cart;
        setCarts(map);
        saveCarts(currentUserId, map);
      })
      .catch(() => {
        // offline or unreachable — keep serving the cached local cart
      });
  }, [currentUserId]);

  // Every change to the cart is mirrored to the local cache for the signed-in user.
  useEffect(() => {
    if (user) saveCarts(user.id, carts);
  }, [user, carts]);

  const totalItemCount = useMemo(() => countItems(carts), [carts]);
  const getCart = useCallback((shopId: string) => carts[shopId], [carts]);

  function addToCart(input: {
    shopId: string;
    variantId: string;
    quantity: number;
    variant: CartItem["variant"];
  }) {
    const { shopId, variantId, quantity, variant } = input;

    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    let previous: Cart | undefined;

    setCarts((prev) => {
      previous = prev[shopId];
      const existingItem = previous?.items.find(
        (i) => i.variantId === variantId,
      );

      let items: CartItem[];
      if (existingItem) {
        items = previous!.items.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      } else {
        const optimisticItem: CartItem = {
          id: `optimistic-${variantId}`,
          cartId: previous?.id ?? "",
          variantId,
          quantity,
          createdAt: new Date().toISOString(),
          variant,
          displayPrice: Number(variant.price),
          originalPrice: null,
          originalCurrency: null,
        };
        items = [...(previous?.items ?? []), optimisticItem];
      }

      const nextCart: Cart = {
        id: previous?.id ?? null,
        shopId,
        items,
        cartCurrency: previous?.cartCurrency ?? variant.product.currency,
        shop: previous?.shop ?? null,
      };

      return { ...prev, [shopId]: nextCart };
    });

    setActiveShopId(shopId);
    setModalOpen(true);

    cartApi
      .addItem({ shopId, variantId, quantity })
      .then(() => cartApi.getCartForShop(shopId))
      .then((fresh) => {
        setCarts((prev) => ({ ...prev, [shopId]: fresh }));
      })
      .catch((err) => {
        setCarts((prev) =>
          previous ? { ...prev, [shopId]: previous } : withoutShop(prev, shopId),
        );
        toast.error(
          err instanceof ApiException
            ? err.message
            : "Impossible d'ajouter au panier.",
        );
      });
  }

  function updateQuantity(shopId: string, itemId: string, quantity: number) {
    if (quantity < 1) return;

    const hasPendingSync = itemId in quantityTimers.current;

    setCarts((prev) => {
      const current = prev[shopId];
      if (!current) return prev;
      if (!hasPendingSync) quantityRollback.current[itemId] = current;

      return {
        ...prev,
        [shopId]: {
          ...current,
          items: current.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i,
          ),
        },
      };
    });

    clearTimeout(quantityTimers.current[itemId]);
    quantityTimers.current[itemId] = setTimeout(() => {
      delete quantityTimers.current[itemId];
      const rollbackTarget = quantityRollback.current[itemId];
      delete quantityRollback.current[itemId];

      cartApi
        .updateItemQuantity(itemId, quantity)
        .then(() => cartApi.getCartForShop(shopId))
        .then((fresh) => {
          setCarts((prev) => ({ ...prev, [shopId]: fresh }));
        })
        .catch((err) => {
          setCarts((prev) => ({
            ...prev,
            [shopId]: rollbackTarget ?? prev[shopId],
          }));
          toast.error(
            err instanceof ApiException ? err.message : "Stock insuffisant.",
          );
        });
    }, QUANTITY_SYNC_DELAY_MS);
  }

  function removeItem(shopId: string, itemId: string) {
    clearTimeout(quantityTimers.current[itemId]);
    delete quantityTimers.current[itemId];
    delete quantityRollback.current[itemId];

    let previous: Cart | undefined;

    setCarts((prev) => {
      previous = prev[shopId];
      if (!previous) return prev;
      return {
        ...prev,
        [shopId]: {
          ...previous,
          items: previous.items.filter((i) => i.id !== itemId),
        },
      };
    });

    cartApi.removeItem(itemId).catch((err) => {
      setCarts((prev) => ({
        ...prev,
        [shopId]: previous ?? prev[shopId],
      }));
      toast.error(
        err instanceof ApiException
          ? err.message
          : "Impossible de retirer cet article.",
      );
    });
  }

  function openCart() {
    const all = Object.values(carts);
    const nonEmpty = all.filter((c) => c.items.length > 0);

    if (nonEmpty.length === 0) {
      if (all.length > 0) {
        setActiveShopId(all[0].shopId);
        setModalOpen(true);
      } else {
        setEmptyModalOpen(true);
      }
      return;
    }

    if (nonEmpty.length === 1) {
      setActiveShopId(nonEmpty[0].shopId);
      setModalOpen(true);
      return;
    }

    setPickerOpen(true);
  }

  return (
    <CartContext.Provider
      value={{
        totalItemCount,
        getCart,
        addToCart,
        updateQuantity,
        removeItem,
        openCart,
      }}
    >
      {children}

      {activeShopId && (
        <CartModal
          shopId={activeShopId}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}

      <CartShopPicker
        carts={Object.values(carts).filter((c) => c.items.length > 0)}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(shopId) => {
          setPickerOpen(false);
          setActiveShopId(shopId);
          setModalOpen(true);
        }}
      />

      <EmptyCartModal open={emptyModalOpen} onOpenChange={setEmptyModalOpen} />

      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
