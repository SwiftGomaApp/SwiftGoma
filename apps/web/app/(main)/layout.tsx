import { Footer } from "@/components/global/footer";
import { Header } from "@/components/global/hearder";
import { ApiStatusBanner } from "@/components/global/api-status-banner";
import { publicApi } from "@/lib/api/routes/public";
import { classifyApiError, type ApiStatus } from "@/lib/api/classify-error";
import { CATEGORIES } from "@/lib/mock-categories";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: Awaited<ReturnType<typeof publicApi.listCategories>> =
    CATEGORIES;
  let status: ApiStatus = null;

  try {
    categories = await publicApi.listCategories();
  } catch (err) {
    status = classifyApiError(err);
    console.warn(
      "[MainLayout] Failed to load categories, using fallback:",
      (err as Error).message,
    );
    categories = CATEGORIES;
  }

  return (
    <>
      {status && <ApiStatusBanner status={status} />}
      <Header categories={categories} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
