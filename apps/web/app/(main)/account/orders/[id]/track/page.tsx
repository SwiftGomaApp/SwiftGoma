import type { Metadata } from "next";
import axios from "axios";
import { notFound, redirect } from "next/navigation";
import { TrackView } from "@/components/track/track-view";
import { getOrder, type OrderDetail } from "@/lib/api/routes/orders";
import { getServerLocale } from "@/lib/language";
import { getRequestPathname } from "@/lib/auth/request-pathname.server";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";

type Props = {
  params: Promise<{ id: string }>;
};

async function loadOrder(id: string): Promise<OrderDetail> {
  try {
    return await getOrder(id);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401)
        redirect(buildSignInHref(await getRequestPathname()));
      if (err.response?.status === 404) notFound();
    }
    throw err;
  }
}

export const metadata: Metadata = {
  title: "Track order | Swiftgoma",
};

export default async function TrackOrderPage({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const order = await loadOrder(id);

  return <TrackView order={order} locale={locale} />;
}
