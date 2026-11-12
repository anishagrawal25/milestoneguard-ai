import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="container py-8 space-y-8 animate-in fade-in-50">
      <Skeleton className="h-4 w-48 rounded-md mb-2" />

      {/* Project Header card skeleton */}
      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 space-y-4">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-8 w-80 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-5 w-48 rounded-md" />
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-6 w-44 rounded-md" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/70 bg-card space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-border/70 bg-card space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
