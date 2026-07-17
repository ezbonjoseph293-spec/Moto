import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="mt-6 h-8 w-2/3" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
        <Skeleton className="hidden h-64 w-full rounded-lg lg:block" />
      </div>
    </main>
  );
}
