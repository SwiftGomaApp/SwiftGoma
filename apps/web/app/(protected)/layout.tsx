import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerUser } from "@/lib/api/get-server-user";
import { Header } from "@/components/global/hearder";
import { Footer } from "@/components/global/footer";
import { RequireAuth } from "@/components/auth/require-auth";
import { publicApi } from "@/lib/api/routes/public";
import { CATEGORIES } from "@/lib/mock-categories";
import { ApiStatus, classifyApiError } from "@/lib/api/classify-error";

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

  if (!user) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/";
    redirect(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <>
      <Header categories={categories} />
      <RequireAuth>{children}</RequireAuth>
      <Footer />
    </>
  );
}
