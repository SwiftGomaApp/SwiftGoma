import "server-only";
import { headers } from "next/headers";

export async function getRequestPathname(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("x-pathname");
}
