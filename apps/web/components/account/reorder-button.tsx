"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";
import type { BuyerOrder } from "@/lib/orders";

type Locale = "en" | "fr";

const STRINGS: Record<Locale, { reorder: string; reordering: string }> = {
  en: { reorder: "Reorder", reordering: "Adding to cart…" },
  fr: { reorder: "Recommander", reordering: "Ajout au panier…" },
};

const REORDERABLE_STATUSES: BuyerOrder["status"][] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
  "FAILED",
];

export function ReorderButton({
  order,
  locale,
}: {
  order: BuyerOrder;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const { addItem } = useCart();
  const [isReordering, setIsReordering] = useState(false);

  if (!REORDERABLE_STATUSES.includes(order.status)) return null;

  async function handleReorder() {
    setIsReordering(true);
    try {
      for (const item of order.items) {
        await addItem(
          order.shopId,
          item.variantId,
          item.quantity,
          item.productName,
        );
      }
    } finally {
      setIsReordering(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleReorder}
      disabled={isReordering}
    >
      <RotateCw className={isReordering ? "size-4 animate-spin" : "size-4"} />
      {isReordering ? t.reordering : t.reorder}
    </Button>
  );
}

export default ReorderButton;
