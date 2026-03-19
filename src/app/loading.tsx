import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="mt-6">
        <Skeleton className="h-[44px] w-full" />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[44px] w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-[44px] w-full sm:w-[320px]" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[44px] w-28 rounded-full" />
          ))}
        </div>
      </div>

      <div className="mt-6 text-sm text-[color:var(--muted)]">Loading…</div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-5 w-3/4" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="mt-5">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

