export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-border rounded-lg ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">
      {/* Title */}
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-8 w-48 mb-6" />
      {/* Verdict */}
      <Skeleton className="h-20 w-full rounded-2xl mb-6" />
      {/* Chart */}
      <Skeleton className="h-48 w-full rounded-2xl mb-6" />
      {/* Checklist */}
      <Skeleton className="h-5 w-40 mb-3" />
      {Array.from({length: 5}).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl mb-2" />
      ))}
      {/* Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mt-6">
        {Array.from({length: 10}).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
