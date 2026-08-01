import { Footer } from "@/components/global/footer";
import { Header } from "@/components/global/hearder";
import { CATEGORIES } from "@/lib/mock-categories";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header categories={CATEGORIES} />
      {children}
      <Footer />
    </>
  );
}
