import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import axios from "axios";
import { CalendarDays, MapPin, Store, Truck } from "lucide-react";
import { ReorderButton } from "@/components/account/reorder-button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { OrderTracking } from "@/components/account/order-tracking";
import { getOrder, type OrderDetail } from "@/lib/api/routes/orders";
import { formatMoney } from "@/lib/products";
import { getServerLocale } from "@/lib/language";
import OrderChat from "@/components/account/oder-chat";

type Props = {
  params: Promise<{ id: string }>;
};

const STRINGS = {
  en: {
    orders: "Orders",
    orderPlaced: "Order placed",
    delivery: "Delivery",
    pickup: "Pickup",
    items: "Items",
    summary: "Summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    total: "Total",
    deliveryAddress: "Delivery address",
  },
  fr: {
    orders: "Commandes",
    orderPlaced: "Commande passée",
    delivery: "Livraison",
    pickup: "Retrait",
    items: "Articles",
    summary: "Récapitulatif",
    subtotal: "Sous-total",
    deliveryFee: "Frais de livraison",
    total: "Total",
    deliveryAddress: "Adresse de livraison",
  },
} as const;

function formatDate(date: string, locale: "en" | "fr") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

async function loadOrder(id: string): Promise<OrderDetail> {
  try {
    return await getOrder(id);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) redirect("/auth/sign-in");
      if (err.response?.status === 404) notFound();
    }
    throw err;
  }
}

export const metadata: Metadata = {
  title: "Order details | Swiftgoma",
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  const order = await loadOrder(id);

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/account/orders" />}>
              {t.orders}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{order.id.slice(0, 8)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/shops/${order.shop.slug}`}
            className="text-lg font-semibold text-foreground hover:text-primary"
          >
            {order.shop.name}
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            {t.orderPlaced} · {formatDate(order.createdAt, locale)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <OrderTracking order={order} locale={locale} />
          <div className="mt-6">
            <OrderChat order={order} locale={locale} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t.items}</h2>
            <div className="mt-3 space-y-3">
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              {t.summary}
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t.subtotal}</dt>
                <dd className="text-foreground">
                  {formatMoney(Number(order.subtotal), order.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t.deliveryFee}</dt>
                <dd className="text-foreground">
                  {formatMoney(Number(order.deliveryFee), order.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                <dt className="text-foreground">{t.total}</dt>
                <dd className="text-foreground">
                  {formatMoney(Number(order.total), order.currency)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {order.fulfillmentMethod === "DELIVERY" ? (
                <Truck className="size-4" aria-hidden="true" />
              ) : (
                <Store className="size-4" aria-hidden="true" />
              )}
              {order.fulfillmentMethod === "DELIVERY" ? t.delivery : t.pickup}
            </div>
            {order.deliveryAddress && (
              <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{order.deliveryAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/shops/${order.shop.slug}`}
            className="text-lg font-semibold text-foreground hover:text-primary"
          >
            {order.shop.name}
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            {t.orderPlaced} · {formatDate(order.createdAt, locale)}
          </div>
        </div>
        <ReorderButton order={order} locale={locale} />
      </div>
    </div>
  );
}
