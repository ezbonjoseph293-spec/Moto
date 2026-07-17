import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function hrefFor(searchParams: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/inventory?${params.toString()}`;
}

export function VehiclePagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={hrefFor(searchParams, Math.max(1, page - 1))} />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <PaginationItem key={p}>
              {idx > 0 && arr[idx - 1] !== p - 1 ? (
                <span className="px-1 text-muted-foreground">…</span>
              ) : null}
              <PaginationLink href={hrefFor(searchParams, p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
        <PaginationItem>
          <PaginationNext href={hrefFor(searchParams, Math.min(totalPages, page + 1))} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
