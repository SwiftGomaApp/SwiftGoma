import "server-only";
import axios from "axios";

import { createServerApiClient } from "@/lib/api/server";
import type { AuthUser } from "@/lib/api/routes/auth.routes";

type ApiEnvelope<T> = { success: boolean; data: T };

export async function getServerUser(): Promise<AuthUser | null> {
  const client = await createServerApiClient();

  try {
    const { data } = await client.get<ApiEnvelope<AuthUser>>("/auth/me");
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      return null;
    }
    throw err;
  }
}
