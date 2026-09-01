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
    <main className="flex flex-1 flex-col">
      <Header categories={categories} />
      <div className="flex-1">{children}</div>
      <Footer />
    </main>
  );
}
