import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerUser } from "@/lib/api/get-server-user";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (user) {
    redirect("/");
  }

  return <>{children}</>;
}
