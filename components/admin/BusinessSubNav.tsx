import Link from "next/link";
import { cn } from "@/lib/utils";

interface BusinessSubNavProps {
  organizationId: string;
  active: "details" | "builder";
}

export function BusinessSubNav({ organizationId, active }: BusinessSubNavProps) {
  const tabs = [
    { key: "details" as const, label: "Business Details", href: `/admin/businesses/${organizationId}` },
    { key: "builder" as const, label: "Profile Builder", href: `/admin/businesses/${organizationId}/builder` },
  ];

  return (
    <div className="flex gap-1 border-b border-[var(--admin-border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-[var(--admin-accent)] text-[var(--admin-text)]"
              : "border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
