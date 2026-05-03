interface GoalProgressProps {
  percentage: number;
}

const getProgressColor = (pct: number): string => {
  if (pct >= 100) return '#f59e0b';
  if (pct >= 50) return '#22c55e';
  return 'hsl(var(--primary))';
};

const GoalProgress = ({ percentage }: GoalProgressProps) => {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium tracking-wide uppercase">Progress</span>
        <span className="font-mono font-semibold transition-colors duration-500" style={{ color: getProgressColor(percentage) }}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: getProgressColor(percentage),
            transition: 'width 500ms ease-out, background-color 600ms ease',
          }}
        />
      </div>
    </div>
  );
};

export default GoalProgress;
