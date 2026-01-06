import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
  compact?: boolean;
}

export function Money({ 
  amount, 
  currency = "USD", 
  className,
  showSign = false,
  compact = false 
}: MoneyProps) {
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 2,
  };
  
  if (compact) {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = 'short';
  }
  
  const formatted = new Intl.NumberFormat('en-US', formatOptions).format(Math.abs(amount));
  
  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
  
  return (
    <span className={cn(
      "font-medium tabular-nums",
      amount > 0 && showSign && "text-success",
      amount < 0 && showSign && "text-destructive",
      className
    )}>
      {sign}{formatted}
    </span>
  );
}

interface SharesProgressProps {
  sold: number;
  total: number;
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SharesProgress({ 
  sold, 
  total, 
  className,
  showLabels = true,
  size = "md"
}: SharesProgressProps) {
  const progress = total > 0 ? (sold / total) * 100 : 0;
  const remaining = total - sold;
  
  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];
  
  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{sold.toLocaleString()} sold</span>
          <span>{remaining.toLocaleString()} remaining</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", heightClass)}>
        <div 
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-500",
            progress >= 90 && "from-success to-success/80"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-end mt-1">
          <span className="text-xs font-medium text-accent">{progress.toFixed(1)}% funded</span>
        </div>
      )}
    </div>
  );
}

interface LockedFieldProps {
  label: string;
  status?: 'not_requested' | 'pending' | 'approved' | 'rejected' | 'revoked';
  reason?: string;
  className?: string;
}

export function LockedField({ label, status = 'not_requested', reason, className }: LockedFieldProps) {
  const statusConfig = {
    not_requested: {
      icon: "🔒",
      text: "Request access to view",
      color: "text-muted-foreground",
    },
    pending: {
      icon: "⏳",
      text: "Access request pending",
      color: "text-warning",
    },
    approved: {
      icon: "✓",
      text: "Access granted",
      color: "text-success",
    },
    rejected: {
      icon: "✕",
      text: "Access denied",
      color: "text-destructive",
    },
    revoked: {
      icon: "⚠",
      text: "Access revoked",
      color: "text-destructive",
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={cn(
      "relative rounded-lg border border-dashed p-4",
      status === 'not_requested' && "border-muted-foreground/30 bg-muted/30",
      status === 'pending' && "border-warning/30 bg-warning/5",
      status === 'rejected' && "border-destructive/30 bg-destructive/5",
      status === 'revoked' && "border-destructive/30 bg-destructive/5",
      className
    )}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className={cn("text-xs", config.color)}>{config.text}</p>
          {reason && (
            <p className="text-xs text-muted-foreground mt-1 italic">"{reason}"</p>
          )}
        </div>
      </div>
      {status === 'not_requested' && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/0 via-muted/30 to-muted/0 animate-pulse pointer-events-none rounded-lg" />
      )}
    </div>
  );
}
