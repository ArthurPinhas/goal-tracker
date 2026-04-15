interface MilestoneProgressProps {
  percentage: number;
}

const MilestoneProgress = ({ percentage }: MilestoneProgressProps) => {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium tracking-wide uppercase">Progress</span>
        <span className="text-primary font-mono font-semibold">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-progress-track overflow-hidden">
        <div
          className="h-full rounded-full bg-progress-fill transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default MilestoneProgress;
