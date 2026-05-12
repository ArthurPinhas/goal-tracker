import SkeletonGoalCard from "@/components/SkeletonGoalCard";

/** Shown while the main goals route chunk loads — matches the real header + card layout. */
const IndexRouteFallback = () => (
  <div className="min-h-screen bg-background relative">
    <div className="gradient-header px-4 pt-10 pb-8 relative overflow-hidden border-b border-white/10">
      <div className="max-w-[min(100%,88rem)] mx-auto relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-white/25 animate-pulse" />
          <div className="h-3 w-24 rounded-md bg-white/20 animate-pulse" />
        </div>
        <div className="h-9 w-52 max-w-[75%] rounded-lg bg-white/[0.28] animate-pulse" />
        <div className="h-3.5 w-full max-w-lg rounded-md bg-white/15 animate-pulse" />
      </div>
    </div>
    <div className="max-w-[min(100%,88rem)] mx-auto px-4 py-6">
      <div className="space-y-3 max-w-2xl">
        <SkeletonGoalCard />
        <SkeletonGoalCard />
      </div>
    </div>
  </div>
);

export default IndexRouteFallback;
