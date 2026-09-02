"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { OrderDetailsModal } from "@/components/account/order-details-modal";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";

interface OrderDetailsContextValue {
  openOrderDetails: (orderId: string) => void;
}

const OrderDetailsContext = createContext<OrderDetailsContextValue | undefined>(
  undefined,
);

export function OrderDetailsProvider({ children }: { children: ReactNode }) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  return (
    <OrderDetailsContext.Provider value={{ openOrderDetails: setOrderId }}>
      {children}
      <OrderDetailsModal
        orderId={orderId}
        onOpenChange={(open) => {
          if (!open) setOrderId(null);
        }}
        locale={locale}
      />
    </OrderDetailsContext.Provider>
  );
}

export function useOrderDetails() {
  const ctx = useContext(OrderDetailsContext);
  if (!ctx) {
    throw new Error("useOrderDetails must be used within an OrderDetailsProvider");
  }
  return ctx;
}
