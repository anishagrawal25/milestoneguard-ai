import { Skeleton } from "@/components/ui/skeleton";

export default function MilestoneLoading() {
  return (
    <div className="container py-8 space-y-6 max-w-6xl animate-in fade-in-50">
      <Skeleton className="h-4 w-60 rounded-md mb-2" />

      {/* Stepper skeleton */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Hero Action panel skeleton */}
      <div className="p-8 rounded-2xl border border-border/70 bg-card space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 w-80 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-64 rounded-xl" />
      </div>

      {/* Two columns: Criteria & Report skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        <div className="lg:col-span-5 p-6 rounded-2xl border border-border/70 bg-card space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-7 p-6 rounded-2xl border border-border/70 bg-card space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
