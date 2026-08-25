import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ProductListPagination } from "@/lib/api/routes/products";

type SearchParams = Record<string, string | string[] | undefined>;

function buildPageHref(
  searchParams: SearchParams,
  page: number,
  basePath: string,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }

  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) result.push("ellipsis");
    result.push(page);
    prev = page;
  }
  return result;
}

export function ProductPagination({
  pagination,
  searchParams,
  basePath = "/products",
}: {
  pagination: ProductListPagination;
  searchParams: SearchParams;
  basePath?: string;
}) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildPageHref(searchParams, Math.max(1, page - 1), basePath)}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {pageNumbers.map((entry, idx) =>
          entry === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <span className="flex size-9 items-center justify-center text-muted-foreground">
                …
              </span>
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink
                href={buildPageHref(searchParams, entry, basePath)}
                isActive={entry === page}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={buildPageHref(
              searchParams,
              Math.min(totalPages, page + 1),
              basePath,
            )}
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages ? "pointer-events-none opacity-50" : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default ProductPagination;
