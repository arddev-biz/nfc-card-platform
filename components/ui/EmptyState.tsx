import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed p-12 text-center">
      <p className="text-[var(--admin-text)]">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
