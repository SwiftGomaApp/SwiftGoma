import { redirect } from "next/navigation";

type User = {
  name: string;
  email: string;
  role: "ADMIN" | "SUPPORT";
};

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user: User = {
    name: "Gael Balekage",
    email: "gbalekage21@gmail.com",
    role: "ADMIN",
  };

  if (user.role === "SUPPORT") {
    redirect("/user/support");
  }

  if (user.role === "ADMIN") {
    redirect("/user/admin");
  }

  return <div className="min-h-full">{children}</div>;
}
