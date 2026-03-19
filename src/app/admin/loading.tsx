import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-80" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-14" />
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-4 h-40 w-full rounded-[14px]" />
      </Card>
    </div>
  );
}

