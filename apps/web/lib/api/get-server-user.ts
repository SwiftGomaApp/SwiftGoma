import { cookies } from "next/headers";
import type { User } from "./routes/auth";

export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/auth/me`,
      {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const body = await res.json();
    return body.data as User;
  } catch {
    return null;
  }
}
