import "server-only";
import axios from "axios";
import { cookies } from "next/headers";
import { env } from "@/lib/api/config/env";

export async function createServerApiClient() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return axios.create({
    baseURL: env.server.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });
}

export async function forwardSetCookies(setCookieHeader?: string | string[]) {
  if (!setCookieHeader) return;
  const cookieStore = await cookies();
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const raw of headers) {
    const [pair] = raw.split(";");
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const name = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    cookieStore.set(name, value);
  }
}
