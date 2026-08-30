import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import axios from "axios";
import { CalendarDays, MapPin, Package, Store, Truck } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ProductPagination } from "@/components/products/product-pagination";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import {
  getMyOrders,
  type BuyerOrder,
  type OrderListPagination,
} from "@/lib/api/routes/orders";
import { formatMoney } from "@/lib/products";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Orders | Swiftgoma",
};

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SearchParams>;
};

const STRINGS = {
  en: {
    title: "Orders",
    description: "Your past and current orders, across every shop.",
    resultsOne: "order",
    resultsMany: "orders",
    emptyTitle: "No orders yet",
    emptyDescription:
      "Once you place an order, you'll be able to track it here.",
    browseShops: "Browse shops",
    delivery: "Delivery",
    pickup: "Pickup",
    itemsOne: (n: number) => `${n} item`,
    itemsMany: (n: number) => `${n} items`,
    total: "Total",
  },
  fr: {
    title: "Commandes",
    description: "Vos commandes passées et en cours, toutes boutiques confondues.",
    resultsOne: "commande",
    resultsMany: "commandes",
    emptyTitle: "Aucune commande pour le moment",
    emptyDescription:
      "Une fois que vous passerez une commande, vous pourrez la suivre ici.",
    browseShops: "Parcourir les boutiques",
    delivery: "Livraison",
    pickup: "Retrait",
    itemsOne: (n: number) => `${n} article`,
    itemsMany: (n: number) => `${n} articles`,
    total: "Total",
  },
} as const;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function formatDate(date: string, locale: "en" | "fr") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function OrderCard({
  order,
  locale,
  t,
}: {
  order: BuyerOrder;
  locale: "en" | "fr";
  t: (typeof STRINGS)[keyof typeof STRINGS];
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-foreground">
            {order.shop.name}
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatDate(order.createdAt, locale)}
          </div>
        </div>
        <OrderStatusBadge status={order.status} locale={locale} />
      </div>

      <div className="mt-4 space-y-1.5 border-t border-border pt-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="min-w-0 truncate text-muted-foreground">
              {item.quantity}× {item.productName}
              {item.variantName ? ` — ${item.variantName}` : ""}
            </span>
            <span className="shrink-0 font-medium text-foreground">
              {formatMoney(Number(item.subtotal), order.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {order.fulfillmentMethod === "DELIVERY" ? (
              <Truck className="size-3.5" aria-hidden="true" />
            ) : (
              <Store className="size-3.5" aria-hidden="true" />
            )}
            {order.fulfillmentMethod === "DELIVERY" ? t.delivery : t.pickup}
          </span>
          <span className="flex items-center gap-1.5">
            <Package className="size-3.5" aria-hidden="true" />
            {itemCount === 1 ? t.itemsOne(itemCount) : t.itemsMany(itemCount)}
          </span>
          {order.deliveryAddress && (
            <span className="hidden items-center gap-1.5 sm:flex">
              <MapPin className="size-3.5" aria-hidden="true" />
              <span className="max-w-48 truncate">
                {order.deliveryAddress}
              </span>
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">{t.total} </span>
          <span className="font-semibold text-foreground">
            {formatMoney(Number(order.total), order.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function AccountOrdersPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  const sp = await searchParams;
  const page = parsePage(firstValue(sp.page));

  let orders: BuyerOrder[] = [];
  let pagination: OrderListPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  try {
    const result = await getMyOrders({ page, limit: 20 });
    orders = result.orders;
    pagination = result.pagination;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      redirect("/auth/sign-in");
    }
    throw err;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>

      {pagination.total > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {pagination.total}{" "}
          {pagination.total === 1 ? t.resultsOne : t.resultsMany}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="mt-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button nativeButton={false} render={<Link href="/shops" />}>
                {t.browseShops}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} locale={locale} t={t} />
            ))}
          </div>
          <div className="mt-8">
            <ProductPagination
              pagination={pagination}
              searchParams={sp}
              basePath="/account/orders"
            />
          </div>
        </>
      )}
    </div>
  );
}
