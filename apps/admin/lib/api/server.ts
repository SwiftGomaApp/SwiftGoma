import axios, { type AxiosInstance } from "axios";
import { cookies } from "next/headers";
import { env } from "@/lib/api/config/env";

export function createServerApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.server.apiBaseUrl, 
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SwiftGomaAdmin-Server/1.0 (+Next.js server-side fetch)",
    },
  });

  client.interceptors.request.use(async (config) => {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieHeader) {
      config.headers.Cookie = cookieHeader;
    }
    return config;
  });

  return client;
}
