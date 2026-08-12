import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await getMeServer();
  } catch {
    redirect("/auth/login");
  }

  return <div className="min-h-full">{children}</div>;
}
