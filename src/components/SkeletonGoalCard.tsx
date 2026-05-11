const SkeletonGoalCard = () => (
  <div className="rounded-2xl border border-white/10 bg-card/85 backdrop-blur-md p-6 space-y-5 shadow-lg shadow-black/35 dark:shadow-2xl dark:shadow-black/50 animate-pulse">
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-2 flex-1">
        <div className="h-5 w-2/5 rounded bg-secondary" />
        <div className="h-3.5 w-3/5 rounded bg-secondary/70" />
      </div>
      <div className="flex gap-1">
        <div className="h-8 w-8 rounded bg-secondary" />
        <div className="h-8 w-8 rounded bg-secondary" />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-secondary" />
        <div className="h-3 w-8 rounded bg-secondary" />
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden relative">
        <div className="shimmer-bar absolute inset-0 opacity-50" aria-hidden />
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between mb-2">
        <div className="h-3 w-24 rounded bg-secondary" />
        <div className="h-6 w-12 rounded bg-secondary" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-1 px-1">
          <div className="h-4 w-4 rounded bg-secondary shrink-0" />
          <div className="h-3.5 rounded bg-secondary" style={{ width: `${55 + i * 12}%` }} />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonGoalCard;
