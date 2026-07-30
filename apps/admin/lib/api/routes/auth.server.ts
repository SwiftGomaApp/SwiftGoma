import { createServerApiClient } from "@/lib/api/server";
import { unwrap } from "@/lib/api/utils";
import { AuthUser } from "@/types/auth";

export async function getMeServer(): Promise<AuthUser> {
  const client = createServerApiClient();
  const res = await client.get("/auth/me");
  return unwrap<AuthUser>(res);
}
