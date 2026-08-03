import { Footer } from "@/components/global/footer";
import { Header } from "@/components/global/hearder";
import { ServerErrorBanner } from "@/components/global/server-error-banner";
import { ApiException } from "@/lib/api";
import { publicApi } from "@/lib/api/routes/public";
import { CATEGORIES } from "@/lib/mock-categories";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: Awaited<ReturnType<typeof publicApi.listCategories>> =
    CATEGORIES;
  let isServerDown = false;

  try {
    categories = await publicApi.listCategories();
  } catch (err) {
    if (err instanceof ApiException && err.isNetworkError) {
      isServerDown = true;
    } else {
      console.error("[MainLayout] Failed to load categories:", err);
    }
    categories = CATEGORIES; 
  }

  return (
    <>
      {isServerDown && <ServerErrorBanner />}
      <Header categories={categories} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
