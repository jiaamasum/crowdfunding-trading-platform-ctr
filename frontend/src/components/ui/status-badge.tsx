import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ProjectStatus, AccessRequestStatus, PaymentStatus, InvestmentStatus } from "@/types";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        draft: "bg-muted text-muted-foreground",
        pending: "bg-warning/10 text-warning border border-warning/20",
        approved: "bg-success/10 text-success border border-success/20",
        rejected: "bg-destructive/10 text-destructive border border-destructive/20",
        changes: "bg-info/10 text-info border border-info/20",
        archived: "bg-muted text-muted-foreground border border-muted-foreground/20",
        success: "bg-success/10 text-success border border-success/20",
        failed: "bg-destructive/10 text-destructive border border-destructive/20",
        completed: "bg-success/10 text-success border border-success/20",
        cancelled: "bg-muted text-muted-foreground border border-muted-foreground/20",
        revoked: "bg-destructive/10 text-destructive border border-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: ProjectStatus | AccessRequestStatus | PaymentStatus | InvestmentStatus | string;
  className?: string;
  showDot?: boolean;
}

const getVariantForStatus = (status: string): VariantProps<typeof statusBadgeVariants>["variant"] => {
  const statusLower = status.toLowerCase().replace(/_/g, '');
  
  const variantMap: Record<string, VariantProps<typeof statusBadgeVariants>["variant"]> = {
    active: "success",
    inactive: "default",
    draft: "draft",
    pendingreview: "pending",
    pending: "pending",
    requested: "pending",
    approved: "approved",
    rejected: "rejected",
    needschanges: "changes",
    archived: "archived",
    success: "success",
    failed: "failed",
    processing: "pending",
    completed: "completed",
    cancelled: "cancelled",
    revoked: "revoked",
    refunded: "changes",
    withdrawn: "changes",
    reversed: "rejected",
    expired: "default",
  };
  
  return variantMap[statusLower] || "default";
};

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending Review",
    PENDING: "Pending",
    REQUESTED: "Requested",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    EXPIRED: "Expired",
    PROCESSING: "Processing",
    NEEDS_CHANGES: "Needs Changes",
    ARCHIVED: "Archived",
    SUCCESS: "Success",
    FAILED: "Failed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REVOKED: "Revoked",
    REFUNDED: "Refunded",
    WITHDRAWN: "Withdrawn",
    REVERSED: "Reversed",
  };
  
  return labelMap[status] || status.replace(/_/g, ' ');
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const variant = getVariantForStatus(status);
  
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {showDot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
