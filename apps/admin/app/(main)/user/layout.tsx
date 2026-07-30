import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { AuthUser } from "@/types/auth";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: AuthUser;
  try {
    user = (await getMeServer()) as AuthUser;
  } catch {
    redirect("/auth/login");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const destination = user.role === "SUPPORT" ? "/user/support" : "/user/admin";

  const alreadyAtDestination =
    pathname === destination || pathname.startsWith(`${destination}/`);

  if (!alreadyAtDestination) {
    redirect(destination);
  }

  return <div className="min-h-full">{children}</div>;
}
