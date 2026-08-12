import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Centre d'aide",
  description:
    "Questions fréquentes, assistance acheteurs et vendeurs, et contact du support SwiftGoma.",
  path: "/help",
});

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
