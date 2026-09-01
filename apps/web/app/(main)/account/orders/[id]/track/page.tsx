import type { Metadata } from "next";
import Link from "next/link";
import { ComingSoon } from "@/components/account/coming-soon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getServerLocale } from "@/lib/language";

type Props = {
  params: Promise<{ id: string }>;
};

const STRINGS = {
  en: {
    orders: "Orders",
    track: "Track order",
    title: "Live tracking",
    description: "Live order tracking is coming soon.",
  },
  fr: {
    orders: "Commandes",
    track: "Suivi de commande",
    title: "Suivi en direct",
    description: "Le suivi de commande en direct arrive bientôt.",
  },
} as const;

export const metadata: Metadata = {
  title: "Track order | Swiftgoma",
};

export default async function TrackOrderPage({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = STRINGS[locale];

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
            <BreadcrumbLink render={<Link href={`/account/orders/${id}`} />}>
              #{id.slice(0, 8)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t.track}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {t.title}
      </h1>

      <div className="mt-6">
        <ComingSoon title={t.title} description={t.description} />
      </div>
    </div>
  );
}
