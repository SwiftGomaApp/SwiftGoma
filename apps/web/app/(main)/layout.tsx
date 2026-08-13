import { Footer } from "@/components/global/footer";
import { Header } from "@/components/global/hearder";
import { ApiStatusBanner } from "@/components/global/api-status-banner";
import { getCachedCategories } from "@/lib/api/cached-public";
import { classifyApiError, type ApiStatus } from "@/lib/api/classify-error";
import { CATEGORIES } from "@/lib/mock-categories";
import type { Category } from "@/lib/api/routes/public";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: Category[] = CATEGORIES;
  let status: ApiStatus = null;

  try {
    categories = await getCachedCategories();
  } catch (err) {
    status = classifyApiError(err);
    console.warn(
      "[MainLayout] Failed to load categories, using fallback:",
      (err as Error).message,
    );
    categories = CATEGORIES;
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {status && <ApiStatusBanner status={status} />}
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
