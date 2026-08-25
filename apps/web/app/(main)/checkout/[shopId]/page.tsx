import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Checkout | Swiftgoma",
};

type Props = {
  params: Promise<{ shopId: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { shopId } = await params;
  const locale = await getServerLocale();

  return <CheckoutView shopId={shopId} locale={locale} />;
}
