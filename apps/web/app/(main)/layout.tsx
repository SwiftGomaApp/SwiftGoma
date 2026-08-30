import Footer from "@/components/global/footer";
import Header from "@/components/global/header";
import { getPublicCategories } from "@/lib/api/routes/products";
import type { ReactNode } from "react";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const categories = await getPublicCategories().catch(() => []);

  return (
    <main className="flex-1">
      <Header categories={categories} />
      {children}
      <Footer />
    </main>
  );
}
