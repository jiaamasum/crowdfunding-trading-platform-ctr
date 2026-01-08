import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SharesProgressProps {
  sold: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function SharesProgress({ sold, total, showLabel = true, className }: SharesProgressProps) {
  const percentage = total > 0 ? Math.round((sold / total) * 100) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <Progress value={percentage} className="h-2" />
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{sold.toLocaleString()} / {total.toLocaleString()} shares</span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
}
