import { cn } from "@/lib/utils";
import { FolderOpen, Search, AlertCircle, Package, Users, Bell, TrendingUp } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="accent">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function EmptyProjects({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="h-12 w-12" />}
      title="No projects found"
      description="You don't have any projects yet. Create your first project to get started."
      action={onCreateNew ? { label: "Create Project", onClick: onCreateNew } : undefined}
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12" />}
      title="No results found"
      description={`No projects match your search "${query}". Try adjusting your filters or search terms.`}
    />
  );
}

export function EmptyFavorites({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<TrendingUp className="h-12 w-12" />}
      title="No favorites yet"
      description="Start adding projects to your favorites to track them here."
      action={onBrowse ? { label: "Browse Projects", onClick: onBrowse } : undefined}
    />
  );
}

export function EmptyCompare({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<Package className="h-12 w-12" />}
      title="Compare projects side by side"
      description="Add 2-4 projects to your compare list to see them side by side."
      action={onBrowse ? { label: "Browse Projects", onClick: onBrowse } : undefined}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<Bell className="h-12 w-12" />}
      title="All caught up!"
      description="You have no new notifications. We'll let you know when something happens."
    />
  );
}

export function EmptyUsers() {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12" />}
      title="No users found"
      description="No users match your current filters."
    />
  );
}

export function ErrorState({ 
  message = "Something went wrong",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12 text-destructive" />}
      title="Error"
      description={message}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}
