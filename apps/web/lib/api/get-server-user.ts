import { cache } from "react";
import { cookies } from "next/headers";
import { env } from "@/lib/api/config/env";
import type { User } from "./routes/auth";

const ACCESS_TOKEN_COOKIE = "swg_access_token";

export const getServerUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  if (!cookieStore.get(ACCESS_TOKEN_COOKIE)) return null;

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    const res = await fetch(`${env.server.apiBaseUrl}/auth/me`, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "SwiftGomaWeb-Server/1.0 (+Next.js server-side fetch)",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const body = await res.json();
    return body.data as User;
  } catch {
    return null;
  }
});
