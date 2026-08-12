import { createServerApiClient } from "@/lib/api/server";
import { unwrap } from "@/lib/api/utils";
import { AuthUser } from "@/types/auth";
import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "swg_access_token";

export async function getMeServer(): Promise<AuthUser> {
  const cookieStore = await cookies();
  if (!cookieStore.get(ACCESS_TOKEN_COOKIE)) {
    throw new Error("Not authenticated");
  }

  const client = createServerApiClient();
  const res = await client.get("/auth/me");
  return unwrap<AuthUser>(res);
}
