import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function pageHref(pathname: string, searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Server-rendered pagination — works without JS, preserves other query params. */
export function StorefrontPagination({
  pathname,
  searchParams,
  page,
  totalPages,
}: {
  pathname: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const params = new URLSearchParams(
    Object.entries(searchParams).filter((e): e is [string, string] => Boolean(e[1])),
  );

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1].filter(
    (p) => p >= 1 && p <= totalPages,
  ));
  const sorted = Array.from(pages).sort((a, b) => a - b);

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={pageHref(pathname, params, page - 1)} />
          </PaginationItem>
        )}
        {sorted.map((p, i) => (
          <PaginationItem key={p}>
            {i > 0 && sorted[i - 1] !== p - 1 && <PaginationEllipsis />}
            <PaginationLink href={pageHref(pathname, params, p)} isActive={p === page}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < totalPages && (
          <PaginationItem>
            <PaginationNext href={pageHref(pathname, params, page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
