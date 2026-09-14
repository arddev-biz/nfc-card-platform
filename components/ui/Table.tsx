import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--admin-border)] text-sm">{children}</table>
    </Card>
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-[var(--admin-bg)]", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-[var(--admin-border)]", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-[var(--admin-bg)]", className)}
      {...props}
    />
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--admin-text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3.5 text-[var(--admin-text)]", className)} {...props} />
  );
}
