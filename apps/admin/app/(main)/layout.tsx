import { redirect } from "next/navigation";

type User = {
  name: string;
  email: string;
  role: "ADMIN" | "SUPPORT";
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user: User = {
    name: "Gael Balekage",
    email: "gbalekage21@gmail.com",
    role: "ADMIN",
  };

  if (!user) {
    redirect("/auth/login");
  }

  return <div className="min-h-full">{children}</div>;
}
