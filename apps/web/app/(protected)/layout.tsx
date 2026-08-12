import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getServerUser } from "@/lib/api/get-server-user";
import { Header } from "@/components/global/hearder";
import { Footer } from "@/components/global/footer";
import { RequireAuth } from "@/components/auth/require-auth";
import { publicApi } from "@/lib/api/routes/public";
import { CATEGORIES } from "@/lib/mock-categories";
import { ApiStatus, classifyApiError } from "@/lib/api/classify-error";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

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

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  }

  const isTrackPage = /^\/orders\/[^/]+\/track\/?$/.test(pathname);

  return (
    <div
      className={
        isTrackPage
          ? "flex h-dvh max-h-dvh flex-1 flex-col overflow-hidden"
          : "flex min-h-dvh flex-1 flex-col"
      }
    >
      <Header categories={categories} compact={isTrackPage} />
      <div
        className={
          isTrackPage
            ? "relative flex min-h-0 flex-1 flex-col overflow-hidden"
            : "flex flex-1 flex-col"
        }
      >
        <RequireAuth>{children}</RequireAuth>
      </div>
      {!isTrackPage && <Footer />}
    </div>
  );
}
