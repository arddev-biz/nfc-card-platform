"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_MAIN, ADMIN_NAV_SETTINGS, type AdminNavItem } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;

  if (item.status === "soon") {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--admin-text-secondary)] opacity-50"
        aria-disabled="true"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {item.label}
        </span>
        <span className="rounded-full border border-[var(--admin-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
          : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] hover:text-[var(--admin-text)]"
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        {ADMIN_NAV_MAIN.map((item) => (
          <NavLink key={item.key} item={item} active={isItemActive(pathname, item.href)} />
        ))}
      </div>

      <div className="space-y-1 border-t border-[var(--admin-border)] pt-4">
        {ADMIN_NAV_SETTINGS.map((item) => (
          <NavLink key={item.key} item={item} active={isItemActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}
