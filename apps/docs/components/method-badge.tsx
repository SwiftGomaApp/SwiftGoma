import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/lib/types";

const STYLES: Record<HttpMethod, string> = {
  GET: "bg-get text-get-foreground",
  POST: "bg-post text-post-foreground",
  PUT: "bg-put text-put-foreground",
  PATCH: "bg-patch text-patch-foreground",
  DELETE: "bg-delete text-delete-foreground",
};

export function MethodBadge({
  method,
  size = "md",
}: {
  method: HttpMethod;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono font-semibold tracking-wide",
        STYLES[method],
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
      )}
    >
      {method}
    </span>
  );
}
