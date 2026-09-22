"use client";

import { PLATFORM_NAME } from "@/lib/platform";
import { useState } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { MenuIcon, CloseIcon } from "@/components/admin/icons";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-4 py-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--admin-accent)] text-xs font-bold text-[var(--admin-accent-text)]">
        N
      </span>
      <span className="text-sm font-semibold text-[var(--admin-text)]">{PLATFORM_NAME}</span>
    </Link>
  );
}

function AccountArea({ email }: { email: string }) {
  return (
    <div className="border-t border-[var(--admin-border)] p-3">
      <Link
        href="/admin/settings"
        className="block truncate rounded-lg px-3 py-2 text-xs text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] hover:text-[var(--admin-text)]"
      >
        {email}
      </Link>
      <div className="mt-1 px-1">
        <LogoutButton />
      </div>
    </div>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="admin-shell flex min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
        {/* Desktop sidebar — persistent, per PC-first requirement */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] lg:flex">
          <Brand />
          <SidebarNav />
          <AccountArea email={email} />
        </aside>

        {/* Mobile drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)]">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="mr-3 rounded-lg p-2 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)]"
                  aria-label="Close menu"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav />
              <AccountArea email={email} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-3 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="rounded-lg p-2 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="hidden lg:block" />
            <ThemeToggle />
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="admin-content mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
